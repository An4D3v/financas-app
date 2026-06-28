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
  computeBudgets,
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
import { BudgetCard } from './BudgetCard'
import { Summary } from './Summary'
import { TransactionsCard } from './TransactionsCard'
import { ScanReview } from '../ScanReview'
import { Settings } from '../Settings'
import { Account } from '../Account'
import { About } from '../About'
import { TxModal } from '../TxModal'
import { ScrollTopButton } from '../ScrollTopButton'
import { Customize } from '../Customize'
import { BudgetModal } from '../BudgetModal'
import { RecurringModal } from '../RecurringModal'
import { loadOrder, loadCaret, saveOrder, saveCaret, type BlockKey } from '../../lib/customization'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useUndo } from '../../hooks/useUndo'
import { Toast } from '../Toast'

export function Dashboard({ session }: { session: Session }) {
  const username =
    (session.user.user_metadata?.username as string | undefined) ?? session.user.email?.split('@')[0] ?? ''
  const handle = toHandle(username)

  const {
    cats,
    txs,
    profile,
    budgets,
    recurring,
    loading,
    addTx,
    insertScanned,
    delTx,
    restoreTx,
    updateTx,
    saveProfile,
    saveBudgets,
    addRecurring,
    updateRecurring,
    delRecurring,
    restoreRecurring,
  } = useFinanceData(session)

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
  const [showBudget, setShowBudget] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)

  // customização do layout (salva neste aparelho)
  const [caret, setCaret] = useState(loadCaret())
  const [order, setOrder] = useState<BlockKey[]>(loadOrder())

  // reordenar seções só faz sentido no empilhado do celular; no desktop o layout é fixo (2-col)
  const isMobile = useMediaQuery('(max-width: 680px)')
  const undo = useUndo()

  // trava o scroll do fundo enquanto um modal está aberto (menu/calendário são popovers, não travam)
  useEffect(() => {
    const open =
      !!reviewData || showSettings || showAccount || showAbout || showAll || showCustomize || showBudget || showRecurring
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [reviewData, showSettings, showAccount, showAbout, showAll, showCustomize, showBudget, showRecurring])

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
  const budgetRows = useMemo(() => computeBudgets(budgets, txs), [budgets, txs])
  const usedCategoryIds = useMemo(
    () => [...new Set(txs.map((t) => t.category_id).filter((id): id is string => !!id))],
    [txs],
  )

  // exclusões com opção de desfazer (toast)
  const onDeleteTx = (id: string) => {
    const removed = txs.find((t) => t.id === id)
    delTx(id)
    if (removed) undo.show('lançamento excluído', () => restoreTx(removed))
  }
  const onDeleteRecurring = (id: string) => {
    const removed = recurring.find((r) => r.id === id)
    delRecurring(id)
    if (removed) undo.show('conta fixa excluída', () => restoreRecurring(removed))
  }

  /** desenha cada seção do dashboard na ordem escolhida pelo usuário */
  const renderBlock = (key: BlockKey) => {
    switch (key) {
      case 'kpis':
        return <Kpis key="kpis" renda={totals.renda} gastos={totals.gastos} saldo={totals.saldo} periodLabel={label} />
      case 'entry':
        return <EntryForm key="entry" cats={cats} onAdd={addTx} onScanned={setReviewData} />
      case 'chart':
        return <CategoryChart key="chart" data={pie} timeSeries={timeSeries} periodLabel={label} />
      case 'budget':
        return budgetRows.length ? (
          <BudgetCard key="budget" rows={budgetRows} onEdit={() => setShowBudget(true)} />
        ) : null
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
            onDelete={onDeleteTx}
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

  const anyModal =
    !!reviewData ||
    showSettings ||
    showAccount ||
    showAbout ||
    showAll ||
    showCustomize ||
    showBudget ||
    showRecurring

  return (
    <div className="app">
      <TopBar
        handle={handle}
        profile={profile}
        showCaret={caret}
        canReorder={isMobile}
        onSettings={() => setShowSettings(true)}
        onCustomize={() => setShowCustomize(true)}
        onBudget={() => setShowBudget(true)}
        onRecurring={() => setShowRecurring(true)}
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

      {isMobile ? (
        order.map(renderBlock)
      ) : (
        <>
          {renderBlock('kpis')}
          <div className="grid2">
            {renderBlock('entry')}
            {renderBlock('chart')}
          </div>
          {renderBlock('budget')}
          {renderBlock('summary')}
          {renderBlock('txs')}
        </>
      )}

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
          caret={caret}
          showCaretToggle={!isMobile}
          onPreview={previewTheme}
          onClose={() => {
            previewTheme(theme) // descarta o preview, volta ao tema salvo
            setShowSettings(false)
          }}
          onSave={async (data) => {
            setCaret(data.caret)
            saveCaret(data.caret)
            if (await saveProfile({ profession: data.profession, hobbies: data.hobbies, theme: data.theme })) {
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

      {showBudget && (
        <BudgetModal
          cats={cats}
          budgets={budgets}
          usedCategoryIds={usedCategoryIds}
          onClose={() => setShowBudget(false)}
          onSave={saveBudgets}
        />
      )}

      {showRecurring && (
        <RecurringModal
          cats={cats}
          recurring={recurring}
          onAdd={addRecurring}
          onUpdate={updateRecurring}
          onDelete={onDeleteRecurring}
          onClose={() => setShowRecurring(false)}
        />
      )}

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
        <TxModal txs={listTxs} cats={cats} onDelete={onDeleteTx} onUpdate={updateTx} onClose={() => setShowAll(false)} />
      )}

      {!anyModal && <ScrollTopButton />}
      {undo.pending && <Toast key={undo.pending.id} message={undo.pending.message} onUndo={undo.undo} />}
    </div>
  )
}
