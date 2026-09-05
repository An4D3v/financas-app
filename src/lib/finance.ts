// lógica de análise financeira — funções puras, testáveis e sem React.
// recebem transações e devolvem totais, fatias do gráfico e insights.

import type { Budget, Transaction } from '../types'
import { NO_CATEGORY_COLOR } from './constants'
import { todayStr, daysAgoStr, addDays, brDate } from './format'

export type Period = 'dia' | 'semana' | 'mes' | 'tudo' | 'custom'

export type PieSlice = { name: string; value: number; color: string }

// ----- metas (orçamento) -----
export type BudgetState = 'ok' | 'warn' | 'over'
/** ritmo do gasto no mês em relação ao esperado até hoje (abaixo = bom) */
export type BudgetPace = 'adiantado' | 'no-ritmo' | 'acima'
/** aderência num mês anterior: bateu, estourou ou não há dado (app sem uso naquele mês) */
export type Adherence = 'met' | 'missed' | 'none'
export type BudgetRow = {
  category_id: string | null // null = teto geral do mês
  name: string
  color: string
  limit: number
  spent: number
  pct: number
  remaining: number // limite − gasto (negativo quando estourou)
  state: BudgetState
  pace: BudgetPace | null // null nos 2 primeiros dias (cedo demais p/ julgar)
  projected: number | null // gasto projetado p/ o fim do mês, no ritmo atual
  todayPct: number // posição do "hoje" na barra (0–100)
  history: Adherence[] // 3 meses anteriores, do mais antigo p/ o mais recente
  avg3: number // média dos 3 meses anteriores
  last: number // gasto do mês passado
}
export type BudgetStats = { total: BudgetRow | null; rows: BudgetRow[]; worst: BudgetState; sumLimits: number }
export type BudgetHint = { avg3: number; last: number; current: number }

export type Totals = { renda: number; gastos: number; saldo: number }

export type Insights = {
  savingRate: number | null
  top: PieSlice | null
  topPct: number
  dailyAvg: number
  biggest: Transaction | null
  pct: number | null
  prevLabel: string
}

/** filtra as transações pelo período selecionado */
export function filterByPeriod(txs: Transaction[], period: Period, from = '', to = ''): Transaction[] {
  if (period === 'tudo') return txs
  if (period === 'custom') {
    if (!from || !to) return txs
    return txs.filter((t) => t.occurred_on >= from && t.occurred_on <= to)
  }
  const today = todayStr()
  const weekAgo = daysAgoStr(6)
  const ym = today.slice(0, 7)
  return txs.filter((t) => {
    if (period === 'dia') return t.occurred_on === today
    if (period === 'semana') return t.occurred_on >= weekAgo && t.occurred_on <= today
    return t.occurred_on.slice(0, 7) === ym
  })
}

/** soma renda, gastos e saldo das transações */
export function computeTotals(txs: Transaction[]): Totals {
  let renda = 0
  let gastos = 0
  for (const t of txs) {
    if (t.type === 'entrada') renda += Number(t.amount)
    else gastos += Number(t.amount)
  }
  return { renda, gastos, saldo: renda - gastos }
}

/** agrupa as saídas por categoria, ordenadas da maior para a menor */
export function computePie(txs: Transaction[]): PieSlice[] {
  const byCategory = new Map<string, PieSlice>()
  for (const t of txs) {
    if (t.type !== 'saida') continue
    const name = t.categories?.name ?? 'sem categoria'
    const color = t.categories?.color ?? NO_CATEGORY_COLOR
    const slice = byCategory.get(name) ?? { name, value: 0, color }
    slice.value += Number(t.amount)
    byCategory.set(name, slice)
  }
  return [...byCategory.values()].sort((a, b) => b.value - a.value)
}

const TOTAL_KEY = '__total__'

/** desloca um YYYY-MM em n meses (n negativo = passado) */
export function shiftYm(ym: string, n: number): string {
  const d = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function daysInMonth(ym: string): number {
  return new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()
}

/** saídas por categoria (e o total em TOTAL_KEY) em cada um dos meses pedidos */
function spendByMonth(txs: Transaction[], months: string[]): Map<string, Map<string, number>> {
  const out = new Map(months.map((m) => [m, new Map<string, number>()]))
  for (const t of txs) {
    if (t.type !== 'saida') continue
    const bucket = out.get(t.occurred_on.slice(0, 7))
    if (!bucket) continue
    const v = Number(t.amount)
    bucket.set(TOTAL_KEY, (bucket.get(TOTAL_KEY) ?? 0) + v)
    if (t.category_id) bucket.set(t.category_id, (bucket.get(t.category_id) ?? 0) + v)
  }
  return out
}

/** os 3 meses anteriores + o corrente, em ordem cronológica */
function budgetMonths(today: string): string[] {
  const ym = today.slice(0, 7)
  return [shiftYm(ym, -3), shiftYm(ym, -2), shiftYm(ym, -1), ym]
}

function stateOf(pct: number): BudgetState {
  return pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok'
}

function buildRow(
  key: string,
  name: string,
  color: string,
  limit: number,
  months: string[],
  byMonth: Map<string, Map<string, number>>,
  today: string,
): BudgetRow {
  const ym = today.slice(0, 7)
  const day = Number(today.slice(8, 10))
  const frac = day / daysInMonth(ym)
  const get = (m: string, k: string) => byMonth.get(m)?.get(k) ?? 0
  const prev = months.slice(0, 3)
  const prevSpent = prev.map((m) => get(m, key))
  const spent = get(ym, key)
  const pct = limit > 0 ? (spent / limit) * 100 : 0

  // ritmo e projeção: só a partir do 3º dia — antes disso qualquer compra vira "estouro projetado"
  let pace: BudgetPace | null = null
  let projected: number | null = null
  if (limit > 0 && day >= 3) {
    const expected = limit * frac
    pace = spent <= expected * 0.9 ? 'adiantado' : spent <= expected * 1.1 ? 'no-ritmo' : 'acima'
    projected = Math.round(spent / frac)
  }

  // aderência: usa o limite ATUAL nos meses anteriores (o histórico de limites não é guardado);
  // mês sem NENHUMA saída no app = sem dado, não "bateu"
  const history: Adherence[] = prev.map((m, i) => {
    if (limit <= 0 || get(m, TOTAL_KEY) <= 0) return 'none'
    return prevSpent[i] <= limit ? 'met' : 'missed'
  })

  return {
    category_id: key === TOTAL_KEY ? null : key,
    name,
    color,
    limit,
    spent,
    pct,
    remaining: limit - spent,
    state: stateOf(pct),
    pace,
    projected,
    todayPct: frac * 100,
    history,
    avg3: (prevSpent[0] + prevSpent[1] + prevSpent[2]) / 3,
    last: prevSpent[2],
  }
}

/**
 * progresso das metas no MÊS corrente (independe do filtro de período): teto geral (se houver)
 * + categorias da mais estourada p/ a menos, cada uma com ritmo, projeção e aderência.
 */
export function computeBudgets(budgets: Budget[], txs: Transaction[], today = todayStr()): BudgetStats {
  const months = budgetMonths(today)
  const byMonth = spendByMonth(txs, months)
  let total: BudgetRow | null = null
  const rows: BudgetRow[] = []
  let sumLimits = 0
  for (const b of budgets) {
    const limit = Number(b.amount)
    if (b.category_id == null) {
      total = buildRow(TOTAL_KEY, 'teto do mês', '', limit, months, byMonth, today)
      continue
    }
    sumLimits += limit
    rows.push(
      buildRow(
        b.category_id,
        b.categories?.name ?? 'sem categoria',
        b.categories?.color ?? NO_CATEGORY_COLOR,
        limit,
        months,
        byMonth,
        today,
      ),
    )
  }
  rows.sort((a, b) => b.pct - a.pct)
  const all = total ? [total, ...rows] : rows
  const worst: BudgetState = all.some((r) => r.state === 'over') ? 'over' : all.some((r) => r.state === 'warn') ? 'warn' : 'ok'
  return { total, rows, worst, sumLimits }
}

/** dicas p/ definir metas: média dos 3 meses anteriores, mês passado e gasto do mês corrente — por categoria e no total */
export function budgetHints(txs: Transaction[], today = todayStr()): { byCategory: Map<string, BudgetHint>; total: BudgetHint } {
  const months = budgetMonths(today)
  const byMonth = spendByMonth(txs, months)
  const keys = new Set<string>()
  for (const m of months) for (const k of byMonth.get(m)?.keys() ?? []) keys.add(k)
  const hint = (k: string): BudgetHint => {
    const get = (m: string) => byMonth.get(m)?.get(k) ?? 0
    return { avg3: (get(months[0]) + get(months[1]) + get(months[2])) / 3, last: get(months[2]), current: get(months[3]) }
  }
  const byCategory = new Map<string, BudgetHint>()
  for (const k of keys) if (k !== TOTAL_KEY) byCategory.set(k, hint(k))
  return { byCategory, total: hint(TOTAL_KEY) }
}

/** sugestão de meta a partir da média: arredonda p/ cima na dezena (R$ 412,30 → 420) */
export function suggestLimit(avg3: number): number | null {
  return avg3 > 0 ? Math.ceil(avg3 / 10) * 10 : null
}

/** rótulo curto do período, p/ KPIs e títulos */
export function periodLabel(period: Period, from = '', to = ''): string {
  if (period === 'dia') return 'hoje'
  if (period === 'semana') return '7 dias'
  if (period === 'mes') return 'mês'
  if (period === 'custom' && from && to) return `${brDate(from)}–${brDate(to)}`
  return 'tudo'
}

/** soma das saídas cujo occurred_on satisfaz o predicado */
function sumSaidaWhere(txs: Transaction[], matches: (occurredOn: string) => boolean): number {
  let total = 0
  for (const t of txs) if (t.type === 'saida' && matches(t.occurred_on)) total += Number(t.amount)
  return total
}

/** quantos dias o período cobre, p/ a média diária */
function periodDays(period: Period, periodTxs: Transaction[], from: string, to: string): number {
  const today = todayStr()
  if (period === 'semana') return 7
  if (period === 'mes') return Number(today.slice(8, 10))
  if (period === 'custom' && from && to) {
    const ms = new Date(to + 'T00:00:00').getTime() - new Date(from + 'T00:00:00').getTime()
    return Math.max(1, Math.round(ms / 86400000) + 1)
  }
  if (period === 'tudo') {
    const dates = periodTxs.map((t) => t.occurred_on).sort()
    if (dates.length) {
      const ms = new Date(today + 'T00:00:00').getTime() - new Date(dates[0] + 'T00:00:00').getTime()
      return Math.max(1, Math.round(ms / 86400000) + 1)
    }
  }
  return 1
}

/** gastos do período anterior equivalente + rótulo, p/ comparação */
function previousSpending(
  all: Transaction[],
  period: Period,
  days: number,
  from: string,
  to: string,
): { prevGastos: number | null; prevLabel: string } {
  const today = todayStr()
  if (period === 'mes') {
    const d = new Date(today + 'T00:00:00')
    const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1)
    const prevYm = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
    return { prevGastos: sumSaidaWhere(all, (on) => on.slice(0, 7) === prevYm), prevLabel: 'mês passado' }
  }
  if (period === 'semana') {
    return {
      prevGastos: sumSaidaWhere(all, (on) => on >= daysAgoStr(13) && on <= daysAgoStr(7)),
      prevLabel: 'semana anterior',
    }
  }
  if (period === 'dia') {
    const ontem = daysAgoStr(1)
    return { prevGastos: sumSaidaWhere(all, (on) => on === ontem), prevLabel: 'ontem' }
  }
  if (period === 'custom' && from && to) {
    const prevEnd = addDays(from, -1)
    const prevStart = addDays(from, -days)
    return {
      prevGastos: sumSaidaWhere(all, (on) => on >= prevStart && on <= prevEnd),
      prevLabel: 'período anterior',
    }
  }
  return { prevGastos: null, prevLabel: '' }
}

/** monta os insights do card de resumo */
export function computeInsights(
  all: Transaction[],
  periodTxs: Transaction[],
  period: Period,
  totals: Totals,
  pie: PieSlice[],
  from = '',
  to = '',
): Insights {
  const { renda, gastos, saldo } = totals
  const savingRate = renda > 0 ? (saldo / renda) * 100 : null
  const top = pie[0] ?? null
  const topPct = top && gastos > 0 ? (top.value / gastos) * 100 : 0

  const days = periodDays(period, periodTxs, from, to)
  const dailyAvg = days > 0 ? gastos / days : gastos

  let biggest: Transaction | null = null
  for (const t of periodTxs) {
    if (t.type !== 'saida') continue
    if (!biggest || Number(t.amount) > Number(biggest.amount)) biggest = t
  }

  const { prevGastos, prevLabel } = previousSpending(all, period, days, from, to)
  const pct = prevGastos != null && prevGastos > 0 ? ((gastos - prevGastos) / prevGastos) * 100 : null

  return { savingRate, top, topPct, dailyAvg, biggest, pct, prevLabel }
}

// ----- série temporal (gráfico de linhas) -----

export type TimePoint = Record<string, number | string>
export type TimeSeries = { points: TimePoint[]; lines: { name: string; color: string }[] }

const MONTHS_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** lista de datas YYYY-MM-DD de start a end (inclusive) */
function dayRange(start: string, end: string): string[] {
  const out: string[] = []
  let d = start
  let guard = 0
  while (d <= end && guard++ < 370) {
    out.push(d)
    d = addDays(d, 1)
  }
  return out
}

/** lista de meses YYYY-MM de start a end (inclusive) */
function monthRange(start: string, end: string): string[] {
  const out: string[] = []
  let y = Number(start.slice(0, 4))
  let m = Number(start.slice(5, 7))
  const ey = Number(end.slice(0, 4))
  const em = Number(end.slice(5, 7))
  let guard = 0
  while ((y < ey || (y === ey && m <= em)) && guard++ < 120) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    if (++m > 12) {
      m = 1
      y++
    }
  }
  return out
}

/**
 * série temporal de saídas: eixo X = datas (dia a dia, ou mês a mês no "tudo"),
 * uma linha por categoria (as 6 maiores, p/ não poluir), cada uma com a cor da categoria.
 */
export function buildCategoryTimeSeries(periodTxs: Transaction[], period: Period, from = '', to = ''): TimeSeries {
  const today = todayStr()
  const saidas = periodTxs.filter((t) => t.type === 'saida')

  // escolhe as top 6 categorias (por total) e guarda as cores
  const totals = new Map<string, { total: number; color: string }>()
  for (const t of saidas) {
    const name = t.categories?.name ?? 'sem categoria'
    const cur = totals.get(name) ?? { total: 0, color: t.categories?.color ?? NO_CATEGORY_COLOR }
    cur.total += Number(t.amount)
    totals.set(name, cur)
  }
  const lines = [...totals.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 6)
    .map(([name, v]) => ({ name, color: v.color }))
  const lineNames = new Set(lines.map((l) => l.name))

  // define os "baldes" do eixo X
  let keys: { key: string; label: string }[]
  let bucketOf: (occurredOn: string) => string
  if (period === 'tudo') {
    const dates = saidas.map((t) => t.occurred_on).sort()
    const startD = dates[0] ?? today
    const spanDays =
      Math.round((new Date(today + 'T00:00:00').getTime() - new Date(startD + 'T00:00:00').getTime()) / 86400000) + 1
    if (spanDays <= 92) {
      // histórico curto: dia a dia (senão o "tudo" cairia num mês só → 1 ponto, sem linha)
      keys = dayRange(startD, today).map((d) => ({ key: d, label: brDate(d) }))
      bucketOf = (on) => on
    } else {
      // histórico longo: mês a mês
      keys = monthRange(startD.slice(0, 7), today.slice(0, 7)).map((m) => ({
        key: m,
        label: `${MONTHS_ABBR[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`,
      }))
      bucketOf = (on) => on.slice(0, 7)
    }
  } else {
    let start = today
    let end = today
    if (period === 'semana') start = daysAgoStr(6)
    else if (period === 'mes') start = today.slice(0, 7) + '-01'
    else if (period === 'custom' && from && to) {
      start = from
      end = to
    }
    keys = dayRange(start, end).map((d) => ({ key: d, label: brDate(d) }))
    bucketOf = (on) => on
  }

  // soma as saídas por balde × categoria
  const byKey = new Map<string, Record<string, number>>()
  for (const k of keys) byKey.set(k.key, {})
  for (const t of saidas) {
    const name = t.categories?.name ?? 'sem categoria'
    if (!lineNames.has(name)) continue
    const row = byKey.get(bucketOf(t.occurred_on))
    if (!row) continue
    row[name] = (row[name] ?? 0) + Number(t.amount)
  }

  const points: TimePoint[] = keys.map((k) => {
    const row = byKey.get(k.key) ?? {}
    const p: TimePoint = { label: k.label }
    for (const l of lines) p[l.name] = row[l.name] ?? 0
    return p
  })

  return { points, lines }
}
