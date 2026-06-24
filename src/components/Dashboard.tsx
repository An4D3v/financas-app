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
import { applyTheme, getStoredTheme, type ThemePref } from '../lib/theme'
import type { Category, Transaction, Profile } from '../types'

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
      alert('Nada pra exportar ainda — adiciona uns lancamentos primeiro. :)')
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
        setScanMsg('Nao consegui ler valores nessa foto. Tenta uma mais nitida e reta, ou preenche manual.')
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
    patch: Partial<Pick<Transaction, 'description' | 'category_id' | 'amount' | 'occurred_on'>>,
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

      {showAbout && <About onClose={() => setShowAbout(false)} />}

      {showAll && (
        <TxModal txs={listTxs} cats={cats} onDelete={delTx} onUpdate={updateTx} onClose={() => setShowAll(false)} />
      )}

      {!(reviewData || showSettings || showAccount || showAbout || showAll) && <ScrollTopButton />}
    </div>
  )
}
