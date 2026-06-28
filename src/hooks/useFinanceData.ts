// camada de dados do app: carrega categorias/transações/perfil do Supabase
// e expõe as operações de escrita (criar, editar, excluir, salvar perfil).

import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { applyTheme, type ThemePref } from '../lib/theme'
import type { Budget, Category, Profile, ReviewRow, Transaction, TxPatch } from '../types'

export type NewTx = {
  occurred_on: string
  type: 'entrada' | 'saida'
  description: string
  amount: number
  category_id: string | null
}

export function useFinanceData(session: Session) {
  const [cats, setCats] = useState<Category[]>([])
  const [txs, setTxs] = useState<Transaction[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const [catsRes, txRes, profRes, budgetsRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').maybeSingle(),
      supabase.from('budgets').select('*, categories(name, color)'),
    ])
    // nomes de categoria sempre em minúsculo (combina com a estética do app)
    const rawCats = (catsRes.data as Category[]) ?? []
    setCats(rawCats.map((c) => ({ ...c, name: c.name.toLowerCase() })))
    const rawTxs = (txRes.data as Transaction[]) ?? []
    setTxs(
      rawTxs.map((t) =>
        t.categories ? { ...t, categories: { ...t.categories, name: t.categories.name.toLowerCase() } } : t,
      ),
    )
    const rawBudgets = (budgetsRes.data as Budget[]) ?? []
    setBudgets(
      rawBudgets.map((b) =>
        b.categories ? { ...b, categories: { ...b.categories, name: b.categories.name.toLowerCase() } } : b,
      ),
    )
    const prof = (profRes.data as Profile | null) ?? null
    setProfile(prof)
    if (prof?.theme) applyTheme(prof.theme)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  /** insere um lançamento manual; devolve a mensagem de erro ou null */
  async function addTx(tx: NewTx): Promise<string | null> {
    const { error } = await supabase.from('transactions').insert({ ...tx, source: 'manual' })
    if (error) return error.message
    await reload()
    return null
  }

  /** insere os itens vindos da nota escaneada; devolve quantos entraram */
  async function insertScanned(rows: ReviewRow[], date: string): Promise<number> {
    const toInsert = rows
      .map((r) => ({
        occurred_on: date,
        type: r.type,
        description: r.description.trim(),
        amount: Number(r.value.replace(',', '.')) || 0,
        category_id: r.categoryId || null,
        source: 'foto' as const,
      }))
      .filter((r) => r.description && r.amount > 0)
    if (toInsert.length) {
      const { error } = await supabase.from('transactions').insert(toInsert)
      if (error) {
        alert(error.message)
        return 0
      }
    }
    await reload()
    return toInsert.length
  }

  async function delTx(id: string) {
    setTxs((prev) => prev.filter((t) => t.id !== id))
    await supabase.from('transactions').delete().eq('id', id)
  }

  /** edição inline otimista; refaz a categoria embutida se ela mudou */
  async function updateTx(id: string, patch: TxPatch) {
    setTxs((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const next = { ...t, ...patch }
        if ('category_id' in patch) {
          const c = cats.find((cc) => cc.id === patch.category_id)
          next.categories = c ? { name: c.name, color: c.color } : null
        }
        return next
      }),
    )
    const { error } = await supabase.from('transactions').update(patch).eq('id', id)
    if (error) {
      alert(error.message)
      reload() // reverte recarregando do banco
    }
  }

  async function saveProfile(data: { profession: string; hobbies: string[]; theme: ThemePref }): Promise<boolean> {
    const payload = {
      profession: data.profession || null,
      hobbies: data.hobbies,
      theme: data.theme,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' })
    if (error) {
      alert(error.message)
      return false
    }
    setProfile((p) => ({ ...(p ?? { user_id: session.user.id }), ...payload }) as Profile)
    return true
  }

  /** salva o conjunto desejado de metas: upsert das informadas e remove as que saíram */
  async function saveBudgets(desired: { category_id: string; amount: number }[]): Promise<boolean> {
    const keep = new Set(desired.map((d) => d.category_id))
    const toDelete = budgets.filter((b) => !keep.has(b.category_id)).map((b) => b.id)
    if (desired.length) {
      const rows = desired.map((d) => ({
        user_id: session.user.id,
        category_id: d.category_id,
        amount: d.amount,
        updated_at: new Date().toISOString(),
      }))
      const { error } = await supabase.from('budgets').upsert(rows, { onConflict: 'user_id,category_id' })
      if (error) {
        alert(error.message)
        return false
      }
    }
    if (toDelete.length) {
      const { error } = await supabase.from('budgets').delete().in('id', toDelete)
      if (error) {
        alert(error.message)
        return false
      }
    }
    await reload()
    return true
  }

  return { cats, txs, profile, budgets, loading, reload, addTx, insertScanned, delTx, updateTx, saveProfile, saveBudgets }
}
