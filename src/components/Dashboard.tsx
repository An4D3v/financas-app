import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase } from '../lib/supabase'
import { ScanReview, type ReviewRow } from './ScanReview'
import { Settings } from './Settings'
import { Account } from './Account'
import { About } from './About'
import { TxList } from './TxList'
import { TxModal } from './TxModal'
import { ScrollTopButton } from './ScrollTopButton'
import { RangeCalendar } from './RangeCalendar'
import { applyTheme, getStoredTheme, type ThemePref } from '../lib/theme'
import type { Category, Transaction, Profile } from '../types'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const todayStr = () => new Date().toISOString().slice(0, 10)
function daysAgoStr(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// dona do app (Ana) — vê o "sobre" pessoal; visitantes/testers veem a versao produto
const OWNER_ID = '35e0eaf1-d4cc-4caa-91e4-e2d9518c58a7'

const brDate = (d: string) => (d ? d.slice(8, 10) + '/' + d.slice(5, 7) : '')

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function sumSaidaWhere(txs: Transaction[], pred: (occurredOn: string) => boolean) {
  let s = 0
  for (const t of txs) if (t.type === 'saida' && pred(t.occurred_on)) s += Number(t.amount)
  return s
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
  const [period, setPeriod] = useState<'dia' | 'semana' | 'mes' | 'tudo' | 'custom'>('mes')
  const [catFilter, setCatFilter] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [calOpen, setCalOpen] = useState(false)
  const calRef = useRef<HTMLDivElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [showAccount, setShowAccount] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [theme, setTheme] = useState<ThemePref>(getStoredTheme())

  async function load() {
    const [catsRes, txRes, profRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').maybeSingle(),
    ])
    setCats((catsRes.data as Category[]) ?? [])
    setTxs((txRes.data as Transaction[]) ?? [])
    const prof = (profRes.data as Profile | null) ?? null
    setProfile(prof)
    if (prof?.theme) {
      setTheme(prof.theme)
      applyTheme(prof.theme)
    }
    setLoading(false)
  }

  function onThemeChange(t: ThemePref) {
    setTheme(t)
    applyTheme(t)
  }

  async function saveProfile(data: { profession: string; hobbies: string[]; theme: ThemePref }) {
    const payload = {
      profession: data.profession || null,
      hobbies: data.hobbies,
      theme: data.theme,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' })
    if (error) {
      alert(error.message)
      return
    }
    setProfile((p) => ({ ...(p ?? { user_id: session.user.id }), ...payload } as Profile))
    setShowSettings(false)
  }

  function exportCSV() {
    setMenuOpen(false)
    if (!txs.length) {
      alert('nada pra exportar ainda — adiciona uns lancamentos primeiro. :)')
      return
    }
    const header = ['data', 'tipo', 'descricao', 'categoria', 'valor']
    const esc = (v: string) => '"' + v.replace(/"/g, '""') + '"'
    const lines = txs.map((t) =>
      [
        t.occurred_on,
        t.type,
        t.description ?? '',
        t.categories?.name ?? '',
        Number(t.amount).toFixed(2).replace('.', ','),
      ]
        .map((c) => esc(String(c)))
        .join(';'),
    )
    // ; como separador e BOM p/ o Excel-BR abrir com acento e colunas certas
    const csv = '﻿' + [header.map(esc).join(';'), ...lines].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financas-${todayStr()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    load()
  }, [])

  // fecha o menu ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!menuOpen) return
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // fecha o calendario ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!calOpen) return
    function onDoc(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCalOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [calOpen])

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
        items?: { description?: string; value?: number; category?: string; type?: string }[]
        error?: string
      }
      if (res.error) throw new Error(res.error)
      const items = res.items ?? []
      if (!items.length) {
        setScanMsg('nao consegui ler valores nessa foto. tenta uma mais nitida e reta, ou preenche manual.')
        return
      }
      const rows: ReviewRow[] = items.map((it) => ({
        description: (it.description ?? '').trim(),
        value: (Number(it.value) || 0).toFixed(2).replace('.', ','),
        categoryId: cats.find((c) => c.name.toLowerCase() === (it.category ?? '').toLowerCase())?.id ?? '',
        type: it.type === 'entrada' ? 'entrada' : 'saida',
      }))
      const scanDate = res.date && /^\d{4}-\d{2}-\d{2}$/.test(res.date) ? res.date : todayStr()
      setReviewData({ merchant: res.merchant ?? '', date: scanDate, rows })
    } catch (err) {
      setScanMsg('erro ao escanear: ' + (err instanceof Error ? err.message : String(err)))
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

  async function updateTx(
    id: string,
    patch: Partial<Pick<Transaction, 'description' | 'category_id' | 'amount' | 'occurred_on' | 'type'>>,
  ) {
    // atualiza na tela na hora (otimista) e refaz a categoria embutida se ela mudou
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
      load() // reverte recarregando do banco
    }
  }

  const periodTxs = useMemo(() => {
    if (period === 'tudo') return txs
    if (period === 'custom') {
      if (!customFrom || !customTo) return txs
      return txs.filter((t) => t.occurred_on >= customFrom && t.occurred_on <= customTo)
    }
    const today = todayStr()
    const weekAgo = daysAgoStr(6)
    const ym = today.slice(0, 7)
    return txs.filter((t) => {
      if (period === 'dia') return t.occurred_on === today
      if (period === 'semana') return t.occurred_on >= weekAgo && t.occurred_on <= today
      return t.occurred_on.slice(0, 7) === ym
    })
  }, [txs, period, customFrom, customTo])

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
      const name = t.categories?.name ?? 'sem categoria'
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

  const periodLabel =
    period === 'dia'
      ? 'hoje'
      : period === 'semana'
        ? '7 dias'
        : period === 'mes'
          ? 'mês'
          : period === 'custom' && customFrom && customTo
            ? `${brDate(customFrom)}–${brDate(customTo)}`
            : 'tudo'

  const insights = useMemo(() => {
    const today = todayStr()
    const savingRate = renda > 0 ? (saldo / renda) * 100 : null
    const top = pieData[0] ?? null
    const topPct = top && gastos > 0 ? (top.value / gastos) * 100 : 0

    // dias decorridos do periodo (p/ media diaria)
    let days = 1
    if (period === 'semana') days = 7
    else if (period === 'mes') days = Number(today.slice(8, 10))
    else if (period === 'custom' && customFrom && customTo) {
      const ms = new Date(customTo + 'T00:00:00').getTime() - new Date(customFrom + 'T00:00:00').getTime()
      days = Math.max(1, Math.round(ms / 86400000) + 1)
    } else if (period === 'tudo') {
      const ds = periodTxs.map((t) => t.occurred_on).sort()
      if (ds.length) {
        const ms = new Date(today + 'T00:00:00').getTime() - new Date(ds[0] + 'T00:00:00').getTime()
        days = Math.max(1, Math.round(ms / 86400000) + 1)
      }
    }
    const dailyAvg = days > 0 ? gastos / days : gastos

    let biggest: Transaction | null = null
    for (const t of periodTxs) {
      if (t.type !== 'saida') continue
      if (!biggest || Number(t.amount) > Number(biggest.amount)) biggest = t
    }

    // gastos do periodo anterior equivalente (p/ comparacao)
    let prevGastos: number | null = null
    let prevLabel = ''
    if (period === 'mes') {
      const d = new Date(today + 'T00:00:00')
      const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1)
      const prevYm = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
      prevGastos = sumSaidaWhere(txs, (on) => on.slice(0, 7) === prevYm)
      prevLabel = 'mês passado'
    } else if (period === 'semana') {
      const start = daysAgoStr(13)
      const end = daysAgoStr(7)
      prevGastos = sumSaidaWhere(txs, (on) => on >= start && on <= end)
      prevLabel = 'semana anterior'
    } else if (period === 'dia') {
      const y = daysAgoStr(1)
      prevGastos = sumSaidaWhere(txs, (on) => on === y)
      prevLabel = 'ontem'
    } else if (period === 'custom' && customFrom && customTo) {
      const prevEnd = addDays(customFrom, -1)
      const prevStart = addDays(customFrom, -days)
      prevGastos = sumSaidaWhere(txs, (on) => on >= prevStart && on <= prevEnd)
      prevLabel = 'período anterior'
    }
    const pct = prevGastos != null && prevGastos > 0 ? ((gastos - prevGastos) / prevGastos) * 100 : null

    return { savingRate, top, topPct, dailyAvg, biggest, pct, prevLabel }
  }, [txs, periodTxs, period, renda, gastos, saldo, pieData, customFrom, customTo])

  if (loading) return <div className="center muted">carregando seus dados...</div>

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-wrap">
          <h1 className="brand">
            {handle}@finanças<span className="accent">:~$</span> <span className="dim">dashboard</span>
          </h1>
          {(profile?.profession || (profile?.hobbies?.length ?? 0) > 0) && (
            <p className="bio">
              {profile?.profession && <span className="bio-prof">// {profile.profession}</span>}
              {profile?.hobbies?.map((h) => (
                <span key={h} className="bio-tag">
                  #{h}
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="menu-wrap" ref={menuRef}>
          <button
            className="icon-btn menu-btn"
            title="menu"
            aria-label="menu"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            ≡
          </button>
          {menuOpen && (
            <div className="menu" role="menu">
              <button
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  setShowSettings(true)
                }}
              >
                <span className="menu-ico">⚙️</span> configuracoes
              </button>
              <button
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  setShowAccount(true)
                }}
              >
                <span className="menu-ico">👤</span> minha conta
              </button>
              <button className="menu-item" role="menuitem" onClick={exportCSV}>
                <span className="menu-ico">⬇️</span> exportar dados
              </button>
              <button
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  setShowAbout(true)
                }}
              >
                <span className="menu-ico">ℹ️</span> sobre
              </button>
              <button
                className="menu-item danger"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  supabase.auth.signOut()
                }}
              >
                <span className="menu-ico">🚪</span> sair
              </button>
            </div>
          )}
        </div>
      </header>

      {txs.length === 0 && (
        <section className="card welcome">
          <h2 className="ttl">&gt;_ bem-vindo(a)! 👋</h2>
          <p className="small">seu painel tá zerado — bora dar o primeiro passo:</p>
          <ul className="insights" style={{ marginTop: 10 }}>
            <li className="insight">
              <span className="ins-ico">📷</span>
              <span>
                <b>escaneie uma nota fiscal</b> — a ia lança automático pra você
              </span>
            </li>
            <li className="insight">
              <span className="ins-ico">✍️</span>
              <span>
                ou <b>adicione manual</b> no "novo lançamento" aqui embaixo
              </span>
            </li>
            <li className="insight">
              <span className="ins-ico">📊</span>
              <span>conforme você usa, surgem os números, o gráfico e os insights</span>
            </li>
          </ul>
        </section>
      )}

      <div className="filters">
        <div className="chips">
          {(['dia', 'semana', 'mes', 'tudo'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={'chip' + (period === p ? ' active' : '')}
              onClick={() => setPeriod(p)}
            >
              {p === 'dia' ? 'dia' : p === 'semana' ? 'semana' : p === 'mes' ? 'mês' : 'tudo'}
            </button>
          ))}
          <div className="cal-wrap" ref={calRef}>
            <button
              type="button"
              className={'chip' + (period === 'custom' ? ' active' : '')}
              onClick={() => setCalOpen((o) => !o)}
            >
              📅 {period === 'custom' && customFrom && customTo ? `${brDate(customFrom)}–${brDate(customTo)}` : 'período'}
            </button>
            {calOpen && (
              <RangeCalendar
                from={customFrom}
                to={customTo}
                max={todayStr()}
                onApply={(f, t) => {
                  setCustomFrom(f)
                  setCustomTo(t)
                  setPeriod('custom')
                  setCalOpen(false)
                }}
                onClose={() => setCalOpen(false)}
              />
            )}
          </div>
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
            {scanning ? 'lendo a nota...' : '📷 escanear nota'}
          </button>
          {scanMsg && <p className="msg">{scanMsg}</p>}
          <form className="form" onSubmit={addTx}>
            <div className="row">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <select value={type} onChange={(e) => setType(e.target.value as 'entrada' | 'saida')}>
                <option value="saida">saida</option>
                <option value="entrada">entrada</option>
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
              {saving ? '...' : 'adicionar'}
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
                    <Cell key={i} fill={d.color} stroke="var(--bg)" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => brl(Number(value))}
                  contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--txt)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted small">sem gastos esse mes ainda</p>
          )}
        </section>
      </div>

      {txs.length > 0 && (
      <section className="card">
        <h2 className="ttl">&gt;_ resumo · {periodLabel}</h2>
        {periodTxs.length === 0 ? (
          <p className="muted small">sem lançamentos nesse período pra resumir ainda.</p>
        ) : (
          <ul className="insights">
            {insights.savingRate != null && (
              <li className="insight">
                <span className="ins-ico">{saldo >= 0 ? '💰' : '⚠️'}</span>
                {saldo >= 0 ? (
                  <span>
                    você guardou <b className="green">{insights.savingRate.toFixed(0)}%</b> da sua renda nesse período
                  </span>
                ) : (
                  <span>
                    atenção: gastou <b className="red">{brl(-saldo)}</b> a mais do que ganhou
                  </span>
                )}
              </li>
            )}
            {insights.top && (
              <li className="insight">
                <span className="ins-ico">📊</span>
                <span>
                  <b style={{ color: insights.top.color }}>{insights.top.name}</b> é seu maior gasto:{' '}
                  <b className="pink">{brl(insights.top.value)}</b>{' '}
                  <span className="muted">({insights.topPct.toFixed(0)}% do total)</span>
                </span>
              </li>
            )}
            {gastos > 0 && period !== 'dia' && (
              <li className="insight">
                <span className="ins-ico">📅</span>
                <span>
                  média de <b className="cyan">{brl(insights.dailyAvg)}</b> por dia em gastos
                </span>
              </li>
            )}
            {insights.pct != null && (
              <li className="insight">
                <span className="ins-ico">{insights.pct > 0 ? '📈' : insights.pct < 0 ? '📉' : '➖'}</span>
                {insights.pct > 0 ? (
                  <span>
                    você gastou <b className="red">{insights.pct.toFixed(0)}% a mais</b> que {insights.prevLabel}
                  </span>
                ) : insights.pct < 0 ? (
                  <span>
                    boa! <b className="green">{Math.abs(insights.pct).toFixed(0)}% a menos</b> que {insights.prevLabel}
                  </span>
                ) : (
                  <span>gasto igual ao de {insights.prevLabel}</span>
                )}
              </li>
            )}
            {insights.biggest && (
              <li className="insight">
                <span className="ins-ico">🔝</span>
                <span>
                  maior saída: <b>{insights.biggest.description}</b> ·{' '}
                  <b className="pink">{brl(Number(insights.biggest.amount))}</b>
                </span>
              </li>
            )}
          </ul>
        )}
      </section>
      )}

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
        <TxList txs={listTxs.slice(0, 10)} cats={cats} onDelete={delTx} onUpdate={updateTx} />
        {listTxs.length > 10 && (
          <button type="button" className="btn ver-mais" onClick={() => setShowAll(true)}>
            ver mais {listTxs.length - 10} lancamento{listTxs.length - 10 > 1 ? 's' : ''} →
          </button>
        )}
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

      {showSettings && (
        <Settings
          email={session.user.email ?? ''}
          profession={profile?.profession ?? ''}
          hobbies={profile?.hobbies ?? []}
          theme={theme}
          onTheme={onThemeChange}
          onClose={() => setShowSettings(false)}
          onSave={saveProfile}
        />
      )}

      {showAccount && (
        <Account
          email={session.user.email ?? ''}
          handle={handle}
          createdAt={session.user.created_at ?? ''}
          txCount={txs.length}
          onClose={() => setShowAccount(false)}
        />
      )}

      {showAbout && <About isOwner={session.user.id === OWNER_ID} onClose={() => setShowAbout(false)} />}

      {showAll && (
        <TxModal txs={listTxs} cats={cats} onDelete={delTx} onUpdate={updateTx} onClose={() => setShowAll(false)} />
      )}

      {!(reviewData || showSettings || showAccount || showAbout || showAll) && <ScrollTopButton />}
    </div>
  )
}
