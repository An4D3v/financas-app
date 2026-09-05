// testes da matemática das metas (ritmo, projeção, aderência, dicas) — funções puras com `today` injetado
import { describe, expect, it } from 'vitest'
import { budgetHints, computeBudgets, daysInMonth, shiftYm, suggestLimit } from './finance'
import type { Budget, Transaction } from '../types'

let seq = 0
const tx = (occurred_on: string, amount: number, category_id: string | null, type: 'entrada' | 'saida' = 'saida'): Transaction => ({
  id: String(++seq),
  occurred_on,
  type,
  description: 'x',
  amount,
  category_id,
  created_at: '',
})

const CAT = 'c1'
const budgets: Budget[] = [
  { id: 'b1', category_id: CAT, amount: 1000, categories: { name: 'moradia', color: '#000' } },
  { id: 'bt', category_id: null, amount: 3000 },
]
// setembro/2026 tem 30 dias; junho 600 (bateu), julho 1200 (estourou), agosto 900 (bateu)
const txs = [
  tx('2026-09-02', 300, CAT),
  tx('2026-09-10', 200, CAT),
  tx('2026-09-10', 500, 'c2'),
  tx('2026-09-12', 5000, null, 'entrada'), // renda não conta
  tx('2026-08-05', 900, CAT),
  tx('2026-07-05', 1200, CAT),
  tx('2026-06-05', 600, CAT),
]

describe('meses', () => {
  it('shiftYm atravessa o ano nos dois sentidos', () => {
    expect(shiftYm('2026-01', -1)).toBe('2025-12')
    expect(shiftYm('2026-12', 1)).toBe('2027-01')
    expect(shiftYm('2026-03', -3)).toBe('2025-12')
  })
  it('daysInMonth respeita fevereiro e bissexto', () => {
    expect(daysInMonth('2026-02')).toBe(28)
    expect(daysInMonth('2028-02')).toBe(29)
    expect(daysInMonth('2026-09')).toBe(30)
  })
})

describe('computeBudgets', () => {
  it('gasto do mês, restante, estado, teto geral e soma das metas', () => {
    const s = computeBudgets(budgets, txs, '2026-09-15')
    const r = s.rows[0]
    expect(r.spent).toBe(500)
    expect(r.remaining).toBe(500)
    expect(r.pct).toBe(50)
    expect(r.state).toBe('ok')
    expect(s.total?.spent).toBe(1000) // 300 + 200 + 500 (renda fora)
    expect(s.total?.limit).toBe(3000)
    expect(s.sumLimits).toBe(1000)
  })
  it('no dia 15 de um mês de 30 dias: metade da barra, no ritmo, projeção = 2× o gasto', () => {
    const r = computeBudgets(budgets, txs, '2026-09-15').rows[0]
    expect(r.todayPct).toBe(50)
    expect(r.pace).toBe('no-ritmo')
    expect(r.projected).toBe(1000)
  })
  it('adiantado quando gastou menos que o esperado; acima quando gastou mais', () => {
    expect(computeBudgets(budgets, txs, '2026-09-25').rows[0].pace).toBe('adiantado')
    expect(computeBudgets(budgets, txs, '2026-09-10').rows[0].pace).toBe('acima')
  })
  it('nos 2 primeiros dias não julga ritmo nem projeta', () => {
    const r = computeBudgets(budgets, txs, '2026-09-02').rows[0]
    expect(r.spent).toBe(500) // soma o mês-calendário inteiro (na prática não há lançamento futuro)
    expect(r.pace).toBeNull()
    expect(r.projected).toBeNull()
  })
  it('aderência dos 3 meses anteriores (com o limite atual), média e mês passado', () => {
    const r = computeBudgets(budgets, txs, '2026-09-15').rows[0]
    expect(r.history).toEqual(['met', 'missed', 'met'])
    expect(r.avg3).toBe(900)
    expect(r.last).toBe(900)
  })
  it('mês sem nenhuma saída no app = sem dado, não "bateu"', () => {
    const r = computeBudgets(budgets, [tx('2026-09-02', 100, CAT)], '2026-09-15').rows[0]
    expect(r.history).toEqual(['none', 'none', 'none'])
  })
  it('estourada vem primeiro e o pior estado sobe pro card', () => {
    const more: Budget[] = [...budgets, { id: 'b2', category_id: 'c2', amount: 400, categories: { name: 'lazer', color: '#fff' } }]
    const s = computeBudgets(more, txs, '2026-09-15')
    expect(s.rows[0].name).toBe('lazer')
    expect(s.rows[0].state).toBe('over')
    expect(s.rows[0].remaining).toBe(-100)
    expect(s.worst).toBe('over')
  })
  it('sem teto geral, total é nulo', () => {
    expect(computeBudgets([budgets[0]], txs, '2026-09-15').total).toBeNull()
  })
})

describe('dicas p/ definir metas', () => {
  it('média dos 3 meses anteriores, mês passado e mês corrente, por categoria e no total', () => {
    const h = budgetHints(txs, '2026-09-15')
    expect(h.byCategory.get(CAT)).toEqual({ avg3: 900, months: 3, last: 900, current: 500 })
    expect(h.byCategory.get('c2')).toEqual({ avg3: 0, months: 3, last: 0, current: 500 })
    expect(h.total).toEqual({ avg3: 900, months: 3, last: 900, current: 1000 })
  })
  it('a média só conta os meses em que o app foi usado (quem começou mês passado não vê ÷3)', () => {
    const recent = [tx('2026-09-02', 100, CAT), tx('2026-08-05', 900, CAT)]
    expect(budgetHints(recent, '2026-09-15').byCategory.get(CAT)).toEqual({ avg3: 900, months: 1, last: 900, current: 100 })
    const r = computeBudgets(budgets, recent, '2026-09-15').rows[0]
    expect(r.avg3).toBe(900)
    expect(r.avgMonths).toBe(1)
    expect(r.history).toEqual(['none', 'none', 'met'])
  })
  it('sugestão arredonda p/ cima na dezena e não sugere sem histórico', () => {
    expect(suggestLimit(412.3)).toBe(420)
    expect(suggestLimit(900)).toBe(900)
    expect(suggestLimit(0)).toBeNull()
  })
})
