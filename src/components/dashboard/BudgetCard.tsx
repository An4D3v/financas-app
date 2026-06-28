import { brl } from '../../lib/format'
import type { BudgetRow } from '../../lib/finance'
import { Icon } from '../Icon'

/** card do dashboard: progresso das metas (orçamento) no mês corrente */
export function BudgetCard({ rows, onEdit }: { rows: BudgetRow[]; onEdit: () => void }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2 className="ttl">&gt;_ orçamento · mês</h2>
        <button type="button" className="link" onClick={onEdit}>
          <Icon name="edit" /> ajustar metas
        </button>
      </div>
      <ul className="budgets">
        {rows.map((r) => {
          const state = r.pct >= 100 ? 'over' : r.pct >= 80 ? 'warn' : 'ok'
          return (
            <li key={r.category_id} className="budget-row">
              <div className="budget-top">
                <span className="budget-name">
                  <span className="rank-dot" style={{ background: r.color }} />
                  {r.name}
                </span>
                <span className="budget-val">
                  {brl(r.spent)} <span className="muted">/ {brl(r.limit)}</span>
                </span>
              </div>
              <div className="budget-bar">
                <div className={'budget-fill ' + state} style={{ width: Math.min(100, r.pct) + '%' }} />
              </div>
              <span className={'budget-pct ' + state}>
                {Math.round(r.pct)}%{state === 'over' ? ' · estourou' : state === 'warn' ? ' · quase lá' : ''}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
