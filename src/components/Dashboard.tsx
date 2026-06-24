import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase } from '../lib/supabase'
import { ScanReview, type ReviewRow } from './ScanReview'
import type { Category, Transaction } from '../types'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const todayStr = () => new Date().toISOString().slice(0, 10)
function daysAgoStr(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function Dashboard({ session }: { session: Session }) {
  const handle =
    (session.user.user_metadata?.username as string | undefined) ||
    session.user.email?.split('@')[0] ||
    'user'

  const [cats, setCats] = useState<Category[]>([])
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const [date, setDate] = useState(todayStr())
  const [type, setType] = useState<'entrada' | 'saida'>('saida')
  const [desc, setDesc] = useState('')
  const [catId, setCatId] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [reviewData, setReviewData] = useState<{ merchant: string; date: string; rows: ReviewRow[] } | null>(null)
  const [period, setPeriod] = useState<'dia' | 'semana' | 'mes' | 'tudo'>('mes')
  const [catFilter, setCatFilter] = useState('')

  async function load() {
    const [catsRes, txRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false }),
    ])
    setCats((catsRes.data as Category[]) ?? [])
    setTxs((txRes.data as Transaction[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setScanning(true)
    setScanMsg(null)
    try {
      const base64 = await fileToBase64(file)
      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: { image: base64, mimeType: file.type, categories: cats.map((c) => c.name) },
      })
      if (error) throw error
      const res = (data ?? {}) as {
        merchant?: string
        date?: string
        items?: { description?: string; value?: number; category?: string }[]
        error?: string
      }
      if (res.error) throw new Error(res.error)
      const items = res.items ?? []
      if (!items.length) {
        setScanMsg('Nao consegui ler valores nessa foto. Tenta uma mais nitida e reta, ou preenche manual.')
        return
      }
      const rows: ReviewRow[] = items.map((it) => ({
        description: (it.description ?? '').trim(),
        value: (Number(it.value) || 0).toFixed(2).replace('.', ','),
        categoryId: cats.find((c) => c.name.toLowerCase() === (it.category ?? '').toLowerCase())?.id ?? '',
      }))
      const scanDate = res.date && /^\d{4}-\d{2}-\d{2}$/.test(res.date) ? res.date : todayStr()
      setReviewData({ merchant: res.merchant ?? '', date: scanDate, rows })
    } catch (err) {
      setScanMsg('Erro ao escanear: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setScanning(false)
    }
  }

  async function addTx(e: FormEvent) {
    e.preventDefault()
    const valor = Number(amount.replace(',', '.'))
    if (!desc.trim() || !valor || valor <= 0) return
    setSaving(true)
    const { error } = await supabase.from('transactions').insert({
      occurred_on: date,
      type,
      description: desc.trim(),
      amount: valor,
      category_id: catId || null,
      source: 'manual',
    })
    setSaving(false)
    if (error) {
      alert(error.message)
      return
    }
    setDesc('')
    setAmount('')
    load()
  }

  async function handleBulkInsert(rows: ReviewRow[], date: string) {
    const toInsert = rows
      .map((r) => ({
        occurred_on: date,
        type: 'saida' as const,
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
        return
      }
    }
    setReviewData(null)
    setScanMsg(toInsert.length ? toInsert.length + ' lancamento(s) adicionado(s) pela nota.' : null)
    load()
  }

  async function delTx(id: string) {
    setTxs(txs.filter((t) => t.id !== id))
    await supabase.from('transactions').delete().eq('id', id)
  }

  const periodTxs = useMemo(() => {
    if (period === 'tudo') return txs
    const today = todayStr()
    const weekAgo = daysAgoStr(6)
    const ym = today.slice(0, 7)
    return txs.filter((t) => {
      if (period === 'dia') return t.occurred_on === today
      if (period === 'semana') return t.occurred_on >= weekAgo && t.occurred_on <= today
      return t.occurred_on.slice(0, 7) === ym
    })
  }, [txs, period])

  const { renda, gastos } = useMemo(() => {
    let renda = 0
    let gastos = 0
    for (const t of periodTxs) {
      if (t.type === 'entrada') renda += Number(t.amount)
      else gastos += Number(t.amount)
    }
    return { renda, gastos }
  }, [periodTxs])
  const saldo = renda - gastos

  const pieData = useMemo(() => {
    const m = new Map<string, { name: string; value: number; color: string }>()
    for (const t of periodTxs) {
      if (t.type !== 'saida') continue
      const name = t.categories?.name ?? 'Sem categoria'
      const color = t.categories?.color ?? '#8B949E'
      const cur = m.get(name) ?? { name, value: 0, color }
      cur.value += Number(t.amount)
      m.set(name, cur)
    }
    return [...m.values()].sort((a, b) => b.value - a.value)
  }, [periodTxs])

  const listTxs = useMemo(
    () => periodTxs.filter((t) => !catFilter || t.category_id === catFilter),
    [periodTxs, catFilter],
  )

  const periodLabel = period === 'dia' ? 'hoje' : period === 'semana' ? '7 dias' : period === 'mes' ? 'mês' : 'tudo'

  if (loading) return <div className="center muted">carregando seus dados...</div>

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">
          {handle}@finanças<span className="accent">:~$</span> <span className="dim">dashboard</span>
        </h1>
        <button className="link" onClick={() => supabase.auth.signOut()}>
          sair ({session.user.email})
        </button>
      </header>

      <div className="filters">
        <div className="chips">
          {(['dia', 'semana', 'mes', 'tudo'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={'chip' + (period === p ? ' active' : '')}
              onClick={() => setPeriod(p)}
            >
              {p === 'dia' ? 'Dia' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mês' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>

      <section className="kpis">
        <div className="kpi">
          <span className="lbl">// renda · {periodLabel}</span>
          <span className="val cyan">{brl(renda)}</span>
        </div>
        <div className="kpi">
          <span className="lbl">// gastos · {periodLabel}</span>
          <span className="val pink">{brl(gastos)}</span>
        </div>
        <div className="kpi">
          <span className="lbl">// saldo · {periodLabel}</span>
          <span className={'val ' + (saldo < 0 ? 'red' : 'green')}>{brl(saldo)}</span>
        </div>
      </section>

      <div className="grid2">
        <section className="card">
          <h2 className="ttl">&gt;_ novo lancamento</h2>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={onPickPhoto}
          />
          <button type="button" className="btn scan" onClick={() => fileRef.current?.click()} disabled={scanning}>
            {scanning ? 'lendo a nota...' : '📷 Escanear nota'}
          </button>
          {scanMsg && <p className="msg">{scanMsg}</p>}
          <form className="form" onSubmit={addTx}>
            <div className="row">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <select value={type} onChange={(e) => setType(e.target.value as 'entrada' | 'saida')}>
                <option value="saida">Saida</option>
                <option value="entrada">Entrada</option>
              </select>
            </div>
            <input placeholder="descricao" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <div className="row">
              <select value={catId} onChange={(e) => setCatId(e.target.value)}>
                <option value="">categoria...</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input inputMode="decimal" placeholder="valor R$" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <button className="btn primary" disabled={saving}>
              {saving ? '...' : 'Adicionar'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2 className="ttl">&gt;_ gastos por categoria · {periodLabel}</h2>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} stroke="#0D1117" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => brl(Number(value))}
                  contentStyle={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 8, color: '#E6EDF3' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted small">sem gastos esse mes ainda</p>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h2 className="ttl">&gt;_ lancamentos</h2>
          <select className="cat-filter" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">todas categorias</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {listTxs.length === 0 && <p className="muted small">nenhum lancamento nesse filtro.</p>}
        <ul className="txs">
          {listTxs.map((t) => (
            <li key={t.id} className="tx">
              <span className="dot" style={{ background: t.categories?.color ?? '#8B949E' }} />
              <span className="tx-date">
                {t.occurred_on.slice(8, 10)}/{t.occurred_on.slice(5, 7)}
              </span>
              <span className="tx-desc">
                {t.description} <small className="muted">{t.categories?.name ?? ''}</small>
              </span>
              <span className={'tx-val ' + (t.type === 'entrada' ? 'green' : 'pink')}>
                {t.type === 'entrada' ? '+' : '-'}
                {brl(Number(t.amount))}
              </span>
              <button className="x" onClick={() => delTx(t.id)} title="excluir">
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>

      {reviewData && (
        <ScanReview
          merchant={reviewData.merchant}
          date={reviewData.date}
          items={reviewData.rows}
          categories={cats}
          onCancel={() => setReviewData(null)}
          onConfirm={handleBulkInsert}
        />
      )}
    </div>
  )
}
