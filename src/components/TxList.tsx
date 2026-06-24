import type { Transaction } from '../types'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function TxList({ txs, onDelete }: { txs: Transaction[]; onDelete: (id: string) => void }) {
  return (
    <ul className="txs">
      {txs.map((t) => (
        <li key={t.id} className="tx">
          <span className="dot" style={{ background: t.categories?.color ?? '#8B949E' }} />
          <span className="tx-date">
            {t.occurred_on.slice(8, 10)}/{t.occurred_on.slice(5, 7)}
          </span>
          <span className="tx-desc">
            {t.description} <small className="muted">{t.categories?.name ?? ''}</small>
          </span>
          <span className={'tx-val ' + (t.type === 'entrada' ? 'green' : 'pink')}>
            {t.type === 'entrada' ? '+' : '-'}
            {brl(Number(t.amount))}
          </span>
          <button className="x" onClick={() => onDelete(t.id)} title="excluir">
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}
