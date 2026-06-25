// serviço de leitura da nota fiscal: envia a foto p/ a Edge Function
// (que chama o Gemini) e devolve linhas prontas para o modal de revisão.

import { supabase } from './supabase'
import { fileToBase64, todayStr } from './format'
import type { Category, ReviewRow } from '../types'

export type ScanResult = { merchant: string; date: string; rows: ReviewRow[] }

export async function scanReceipt(file: File, categories: Category[]): Promise<ScanResult> {
  const image = await fileToBase64(file)
  const { data, error } = await supabase.functions.invoke('scan-receipt', {
    body: { image, mimeType: file.type, categories: categories.map((c) => c.name) },
  })
  if (error) throw error

  const res = (data ?? {}) as {
    merchant?: string
    date?: string
    items?: { description?: string; value?: number; category?: string; type?: string }[]
    error?: string
  }
  if (res.error) throw new Error(res.error)

  const rows: ReviewRow[] = (res.items ?? []).map((it) => ({
    description: (it.description ?? '').trim(),
    value: (Number(it.value) || 0).toFixed(2).replace('.', ','),
    categoryId: categories.find((c) => c.name.toLowerCase() === (it.category ?? '').toLowerCase())?.id ?? '',
    type: it.type === 'entrada' ? 'entrada' : 'saida',
  }))
  const date = res.date && /^\d{4}-\d{2}-\d{2}$/.test(res.date) ? res.date : todayStr()
  return { merchant: res.merchant ?? '', date, rows }
}
