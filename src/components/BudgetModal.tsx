import { useState } from 'react'
import { Icon } from './Icon'
import type { Budget, Category } from '../types'

/** modal pra definir o teto mensal (meta) de cada categoria de gasto */
export function BudgetModal({
  cats,
  budgets,
  usedCategoryIds,
  onClose,
  onSave,
}: {
  cats: Category[]
  budgets: Budget[]
  usedCategoryIds: string[]
  onClose: () => void
  onSave: (desired: { category_id: string; amount: number }[]) => Promise<boolean>
}) {
  const budgetMap = new Map(budgets.map((b) => [b.category_id, b.amount]))
  const used = new Set(usedCategoryIds)
  // categorias de gasto relevantes: já usadas em lançamentos ou que já têm meta
  const relevant = cats
    .filter((c) => c.kind !== 'entrada' && (used.has(c.id) || budgetMap.has(c.id)))
    .sort((a, b) => a.name.localeCompare(b.name))

  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const c of relevant) {
      const v = budgetMap.get(c.id)
      init[c.id] = v != null ? String(v).replace('.', ',') : ''
    }
    return init
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    const desired = Object.entries(drafts)
      .map(([category_id, val]) => ({ category_id, amount: Number(val.replace(',', '.')) }))
      .filter((d) => Number.isFinite(d.amount) && d.amount > 0)
    setSaving(true)
    const ok = await onSave(desired)
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="ttl">&gt;_ metas · orçamento mensal</h2>
          <button className="x" onClick={onClose} title="fechar">
            ×
          </button>
        </div>
        <p className="muted small">um teto por categoria, no mês. deixe em branco pra não ter meta.</p>

        {relevant.length === 0 ? (
          <p className="muted small" style={{ margin: '16px 0' }}>
            adicione alguns gastos primeiro — as categorias que você usar aparecem aqui pra definir metas.
          </p>
        ) : (
          <ul className="budget-edit review-rows">
            {relevant.map((c) => (
              <li key={c.id} className="budget-edit-row">
                <span className="budget-name">
                  <span className="rank-dot" style={{ background: c.color ?? '#8b949e' }} />
                  {c.name}
                </span>
                <input
                  className="rev-val"
                  inputMode="decimal"
                  placeholder="sem meta"
                  aria-label={'meta de ' + c.name}
                  value={drafts[c.id] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                />
              </li>
            ))}
          </ul>
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
