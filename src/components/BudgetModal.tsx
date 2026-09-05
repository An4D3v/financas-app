import { useMemo, useState } from 'react'
import { Icon } from './Icon'
import { brl, maskMoney, parseAmount } from '../lib/format'
import { budgetHints, suggestLimit, type BudgetHint } from '../lib/finance'
import type { Budget, Category, Transaction } from '../types'

type Drafts = Record<string, string>
const TOTAL = '__total__'

function stateOf(pct: number) {
  return pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok'
}

/** uma linha do modal: nome, sugestão, campo e a dica (média/mês passado + mini-barra do mês corrente) */
function Row({
  name,
  color,
  hint,
  value,
  onChange,
  total,
}: {
  name: string
  color?: string | null
  hint: BudgetHint | undefined
  value: string
  onChange: (v: string) => void
  total?: boolean
}) {
  const suggestion = hint ? suggestLimit(hint.avg3) : null
  const limit = parseAmount(value)
  const current = hint?.current ?? 0
  const pct = limit > 0 ? (current / limit) * 100 : 0
  return (
    <li className={'bud-row' + (total ? ' total' : '')}>
      <div className="bud-main">
        <span className="budget-name">
          {!total && <span className="rank-dot" style={{ background: color ?? 'var(--muted)' }} />}
          {name}
        </span>
        {suggestion != null && !value && (
          <button type="button" className="bud-use" onClick={() => onChange(maskMoney(String(suggestion)))} title="usar a sugestão">
            usar {suggestion}
          </button>
        )}
        <input
          className="rev-val"
          inputMode="decimal"
          placeholder={suggestion != null ? `sugestão: ${suggestion}` : 'sem meta'}
          aria-label={total ? 'teto do mês' : 'meta de ' + name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onChange(maskMoney(value))}
        />
      </div>
      <div className="bud-hint">
        <span>
          {hint && hint.avg3 > 0
            ? `média 3m ${brl(hint.avg3)} · mês passado ${brl(hint.last)}`
            : current > 0
              ? `este mês ${brl(current)} · sem histórico anterior`
              : 'sem histórico ainda'}
        </span>
        {limit > 0 && current > 0 && (
          <span className="bud-mini" title={`este mês: ${brl(current)} de ${brl(limit)}`} aria-hidden="true">
            <i className={stateOf(pct)} style={{ width: Math.min(100, pct) + '%' }} />
          </span>
        )}
      </div>
    </li>
  )
}

/** modal pra definir o teto do mês e a meta mensal de cada categoria de gasto, com contexto do histórico */
export function BudgetModal({
  cats,
  budgets,
  usedCategoryIds,
  txs,
  onClose,
  onSave,
}: {
  cats: Category[]
  budgets: Budget[]
  usedCategoryIds: string[]
  txs: Transaction[]
  onClose: () => void
  onSave: (desired: { category_id: string; amount: number }[], total: number | null) => Promise<boolean>
}) {
  const hints = useMemo(() => budgetHints(txs), [txs])
  const budgetMap = new Map(budgets.filter((b) => b.category_id != null).map((b) => [b.category_id as string, b.amount]))
  const totalBudget = budgets.find((b) => b.category_id == null)
  const used = new Set(usedCategoryIds)

  // categorias de gasto: as com histórico/meta/uso primeiro (por média), o resto recolhido
  const expense = cats.filter((c) => c.kind !== 'entrada')
  const score = (c: Category) => hints.byCategory.get(c.id)?.avg3 ?? 0
  const isActive = (c: Category) => used.has(c.id) || budgetMap.has(c.id) || (hints.byCategory.get(c.id)?.current ?? 0) > 0 || score(c) > 0
  const active = expense.filter(isActive).sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
  const dormant = expense.filter((c) => !isActive(c)).sort((a, b) => a.name.localeCompare(b.name))
  const [showAll, setShowAll] = useState(false)

  const [drafts, setDrafts] = useState<Drafts>(() => {
    const init: Drafts = {}
    for (const c of expense) {
      const v = budgetMap.get(c.id)
      init[c.id] = v != null ? maskMoney(String(v)) : ''
    }
    init[TOTAL] = totalBudget ? maskMoney(String(totalBudget.amount)) : ''
    return init
  })
  const set = (id: string) => (v: string) => setDrafts((d) => ({ ...d, [id]: v }))
  const [saving, setSaving] = useState(false)

  const totalDraft = parseAmount(drafts[TOTAL] ?? '')
  const sumDrafts = expense.reduce((s, c) => s + (parseAmount(drafts[c.id] ?? '') || 0), 0)
  const overCap = totalDraft > 0 && sumDrafts > totalDraft

  async function save() {
    const desired = expense
      .map((c) => ({ category_id: c.id, amount: parseAmount(drafts[c.id] ?? '') }))
      .filter((d) => Number.isFinite(d.amount) && d.amount > 0)
    setSaving(true)
    const ok = await onSave(desired, totalDraft > 0 ? totalDraft : null)
    setSaving(false)
    if (ok) onClose()
  }

  const rows = showAll ? [...active, ...dormant] : active

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="ttl">&gt;_ metas · orçamento mensal</h2>
          <button className="x" onClick={onClose} title="fechar">
            ×
          </button>
        </div>
        <p className="muted small">um teto pro mês e um por categoria. a sugestão é a média dos últimos 3 meses; em branco = sem meta.</p>

        <ul className="budget-edit review-rows">
          <Row name="teto do mês" hint={hints.total} value={drafts[TOTAL] ?? ''} onChange={set(TOTAL)} total />
          {rows.map((c) => (
            <Row
              key={c.id}
              name={c.name}
              color={c.color}
              hint={hints.byCategory.get(c.id)}
              value={drafts[c.id] ?? ''}
              onChange={set(c.id)}
            />
          ))}
          {dormant.length > 0 && (
            <li>
              <button type="button" className="link bud-more" onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'menos categorias' : `mais categorias (${dormant.length})`}
              </button>
            </li>
          )}
        </ul>

        {overCap && (
          <p className="msg">
            as metas por categoria somam {brl(sumDrafts)}, acima do teto de {brl(totalDraft)}.
          </p>
        )}

        <div className="modal-foot">
          <span className="muted small">teto no mês corrente</span>
          <div>
            <button type="button" className="icon-btn" onClick={onClose} title="cancelar" aria-label="cancelar">
              <Icon name="x" />
            </button>
            <button className="btn primary" disabled={saving} onClick={save} title="salvar" aria-label="salvar">
              {saving ? '...' : <Icon name="save" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
