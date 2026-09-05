import { brl } from '../../lib/format'
import type { BudgetRow, BudgetStats } from '../../lib/finance'
import { Icon } from '../Icon'

// "adiantado" em dinheiro soa como "gastei adiantado" — o rótulo diz o que importa: sobra
const PACE_LABEL = { adiantado: 'com folga', 'no-ritmo': 'no ritmo', acima: 'acima do ritmo' } as const
const ADH_LABEL = { met: 'bateu', missed: 'estourou', none: 'sem dado' } as const

/** uma meta: barra com o marcador do "hoje", restante, ritmo, projeção e a aderência dos 3 meses anteriores */
function Row({ r, total }: { r: BudgetRow; total?: boolean }) {
  const hasHistory = r.history.some((h) => h !== 'none')
  const adhText = r.history.map((h) => ADH_LABEL[h]).join(' · ')
  return (
    <li className={'budget-row' + (total ? ' total' : '')}>
      <div className="budget-top">
        <span className="budget-name">
          <span className="rank-dot" style={total ? { visibility: 'hidden' } : { background: r.color }} />
          <span className="nm">{r.name}</span>
          {hasHistory && (
            <span
              className="adh"
              role="img"
              aria-label={'3 meses anteriores, com a meta atual: ' + adhText}
              title={'3 meses anteriores (com a meta atual): ' + adhText}
            >
              {r.history.map((h, i) => (
                <i key={i} className={h} />
              ))}
            </span>
          )}
        </span>
        <span className="budget-val">
          {brl(r.spent)} <span className="muted">/ {brl(r.limit)}</span>
        </span>
      </div>
      <div className="budget-bar">
        <div className={'budget-fill ' + r.state} style={{ width: Math.min(100, r.pct) + '%' }} />
        <i className="budget-today" style={{ left: r.todayPct + '%' }} title="hoje" aria-hidden="true" />
      </div>
      <span className="budget-meta">
        <span className={r.state}>{Math.round(r.pct)}%</span>
        <span>{r.remaining >= 0 ? `faltam ${brl(r.remaining)}` : `estourou · ${brl(-r.remaining)} acima`}</span>
        {r.pace && r.state !== 'over' && <span className={'pace ' + r.pace}>{PACE_LABEL[r.pace]}</span>}
        {r.projected != null && r.state !== 'over' && <span>fecha em {brl(r.projected)}</span>}
      </span>
    </li>
  )
}

/** card do dashboard: progresso das metas (orçamento) no mês corrente — o ponto de status segue o pior estado */
export function BudgetCard({ stats, onEdit }: { stats: BudgetStats; onEdit: () => void }) {
  return (
    <section className={'card' + (stats.worst !== 'ok' ? ' is-' + stats.worst : '')}>
      <div className="card-head">
        <h2 className="ttl">orçamento · mês</h2>
        <button type="button" className="link" onClick={onEdit}>
          <Icon name="edit" /> ajustar metas
        </button>
      </div>
      <ul className="budgets">
        {stats.total && <Row r={stats.total} total />}
        {stats.rows.map((r) => (
          <Row key={r.category_id ?? 'total'} r={r} />
        ))}
      </ul>
    </section>
  )
}
