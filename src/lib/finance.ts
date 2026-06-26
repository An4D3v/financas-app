// lógica de análise financeira — funções puras, testáveis e sem React.
// recebem transações e devolvem totais, fatias do gráfico e insights.

import type { Transaction } from '../types'
import { NO_CATEGORY_COLOR } from './constants'
import { todayStr, daysAgoStr, addDays, brDate } from './format'

export type Period = 'dia' | 'semana' | 'mes' | 'tudo' | 'custom'

export type PieSlice = { name: string; value: number; color: string }

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
    const months = saidas.map((t) => t.occurred_on.slice(0, 7)).sort()
    const startM = months[0] ?? today.slice(0, 7)
    keys = monthRange(startM, today.slice(0, 7)).map((m) => ({
      key: m,
      label: `${MONTHS_ABBR[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`,
    }))
    bucketOf = (on) => on.slice(0, 7)
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
