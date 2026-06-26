import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { applyTheme, previewTheme, getStoredTheme, type ThemePref } from '../../lib/theme'
import { todayStr, toHandle } from '../../lib/format'
import { OWNER_ID } from '../../lib/constants'
import {
  filterByPeriod,
  computeTotals,
  computePie,
  computeInsights,
  periodLabel,
  buildCategoryTimeSeries,
  type Period,
} from '../../lib/finance'
import { useFinanceData } from '../../hooks/useFinanceData'
import type { ScanResult } from '../../lib/scan'
import { TopBar } from './TopBar'
import { Welcome } from './Welcome'
import { PeriodFilter } from './PeriodFilter'
import { Kpis } from './Kpis'
import { EntryForm } from './EntryForm'
import { CategoryChart } from './CategoryChart'
import { Summary } from './Summary'
import { TransactionsCard } from './TransactionsCard'
import { ScanReview } from '../ScanReview'
import { Settings } from '../Settings'
import { Account } from '../Account'
import { About } from '../About'
import { TxModal } from '../TxModal'
import { ScrollTopButton } from '../ScrollTopButton'
import { Customize } from '../Customize'
import { loadOrder, loadCaret, saveOrder, saveCaret, type BlockKey } from '../../lib/customization'

export function Dashboard({ session }: { session: Session }) {
  const username =
    (session.user.user_metadata?.username as string | undefined) ?? session.user.email?.split('@')[0] ?? ''
  const handle = toHandle(username)

  const { cats, txs, profile, loading, addTx, insertScanned, delTx, updateTx, saveProfile } = useFinanceData(session)

  // filtros
  const [period, setPeriod] = useState<Period>('mes')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [catFilter, setCatFilter] = useState('')

  // tema (o hook aplica o tema salvo ao carregar; aqui só sincronizamos o estado p/ o Settings)
  const [theme, setTheme] = useState<ThemePref>(getStoredTheme())
  useEffect(() => {
    if (profile?.theme) setTheme(profile.theme)
  }, [profile?.theme])

  // modais
  const [reviewData, setReviewData] = useState<ScanResult | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)

  // customização do layout (salva neste aparelho)
  const [caret, setCaret] = useState(loadCaret())
  const [order, setOrder] = useState<BlockKey[]>(loadOrder())

  // trava o scroll do fundo enquanto um modal está aberto (menu/calendário são popovers, não travam)
  useEffect(() => {
    const open = !!reviewData || showSettings || showAccount || showAbout || showAll || showCustomize
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [reviewData, showSettings, showAccount, showAbout, showAll, showCustomize])

  // derivados — lógica pura em lib/finance
  const periodTxs = useMemo(() => filterByPeriod(txs, period, customFrom, customTo), [txs, period, customFrom, customTo])
  const totals = useMemo(() => computeTotals(periodTxs), [periodTxs])
  const pie = useMemo(() => computePie(periodTxs), [periodTxs])
  const timeSeries = useMemo(
    () => buildCategoryTimeSeries(periodTxs, period, customFrom, customTo),
    [periodTxs, period, customFrom, customTo],
  )
  const insights = useMemo(
    () => computeInsights(txs, periodTxs, period, totals, pie, customFrom, customTo),
    [txs, periodTxs, period, totals, pie, customFrom, customTo],
  )
  const listTxs = useMemo(
    () => periodTxs.filter((t) => !catFilter || t.category_id === catFilter),
    [periodTxs, catFilter],
  )
  const label = periodLabel(period, customFrom, customTo)

  /** desenha cada seção do dashboard na ordem escolhida pelo usuário */
  const renderBlock = (key: BlockKey) => {
    switch (key) {
      case 'kpis':
        return <Kpis key="kpis" renda={totals.renda} gastos={totals.gastos} saldo={totals.saldo} periodLabel={label} />
      case 'entry':
        return <EntryForm key="entry" cats={cats} onAdd={addTx} onScanned={setReviewData} />
      case 'chart':
        return <CategoryChart key="chart" data={pie} timeSeries={timeSeries} periodLabel={label} />
      case 'summary':
        return txs.length > 0 ? (
          <Summary
            key="summary"
            insights={insights}
            saldo={totals.saldo}
            gastos={totals.gastos}
            period={period}
            periodLabel={label}
            hasPeriodTxs={periodTxs.length > 0}
          />
        ) : null
      case 'txs':
        return (
          <TransactionsCard
            key="txs"
            txs={listTxs}
            cats={cats}
            catFilter={catFilter}
            onCatFilter={setCatFilter}
            onDelete={delTx}
            onUpdate={updateTx}
            onShowAll={() => setShowAll(true)}
          />
        )
    }
  }

  function exportCSV() {
    if (!txs.length) {
      alert('nada pra exportar ainda — adiciona uns lançamentos primeiro. :)')
      return
    }
    const header = ['data', 'tipo', 'descrição', 'categoria', 'valor']
    const esc = (v: string) => '"' + v.replace(/"/g, '""') + '"'
    const lines = txs.map((t) =>
      [t.occurred_on, t.type, t.description ?? '', t.categories?.name ?? '', Number(t.amount).toFixed(2).replace('.', ',')]
        .map((c) => esc(String(c)))
        .join(';'),
    )
    // ; como separador e BOM (﻿) p/ o Excel-BR abrir com acento e colunas certas
    const csv = '﻿' + [header.map(esc).join(';'), ...lines].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financas-${todayStr()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="center muted">carregando seus dados...</div>

  const anyModal = !!reviewData || showSettings || showAccount || showAbout || showAll || showCustomize

  return (
    <div className="app">
      <TopBar
        handle={handle}
        profile={profile}
        showCaret={caret}
        onSettings={() => setShowSettings(true)}
        onCustomize={() => setShowCustomize(true)}
        onAccount={() => setShowAccount(true)}
        onExport={exportCSV}
        onAbout={() => setShowAbout(true)}
        onSignOut={() => supabase.auth.signOut()}
      />

      {txs.length === 0 && <Welcome />}

      <PeriodFilter
        period={period}
        onPeriod={setPeriod}
        customFrom={customFrom}
        customTo={customTo}
        onApplyRange={(from, to) => {
          setCustomFrom(from)
          setCustomTo(to)
          setPeriod('custom')
        }}
      />

      {order.map(renderBlock)}

      {reviewData && (
        <ScanReview
          merchant={reviewData.merchant}
          date={reviewData.date}
          items={reviewData.rows}
          categories={cats}
          onCancel={() => setReviewData(null)}
          onConfirm={async (rows, date) => {
            await insertScanned(rows, date)
            setReviewData(null)
          }}
        />
      )}

      {showSettings && (
        <Settings
          email={session.user.email ?? ''}
          profession={profile?.profession ?? ''}
          hobbies={profile?.hobbies ?? []}
          theme={theme}
          onPreview={previewTheme}
          onClose={() => {
            previewTheme(theme) // descarta o preview, volta ao tema salvo
            setShowSettings(false)
          }}
          onSave={async (data) => {
            if (await saveProfile(data)) {
              setTheme(data.theme)
              applyTheme(data.theme)
              setShowSettings(false)
            }
          }}
        />
      )}

      {showAccount && (
        <Account
          email={session.user.email ?? ''}
          handle={handle}
          username={username}
          createdAt={session.user.created_at ?? ''}
          txCount={txs.length}
          onClose={() => setShowAccount(false)}
        />
      )}

      {showAbout && <About isOwner={session.user.id === OWNER_ID} onClose={() => setShowAbout(false)} />}

      {showCustomize && (
        <Customize
          caret={caret}
          order={order}
          onClose={() => setShowCustomize(false)}
          onSave={({ caret: c, order: o }) => {
            setCaret(c)
            saveCaret(c)
            setOrder(o)
            saveOrder(o)
            setShowCustomize(false)
          }}
        />
      )}

      {showAll && (
        <TxModal txs={listTxs} cats={cats} onDelete={delTx} onUpdate={updateTx} onClose={() => setShowAll(false)} />
      )}

      {!anyModal && <ScrollTopButton />}
    </div>
  )
}
