import { TxList } from '../TxList'
import type { Category, Transaction, TxPatch } from '../../types'

type Props = {
  txs: Transaction[]
  cats: Category[]
  catFilter: string
  onCatFilter: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: TxPatch) => void
  onShowAll: () => void
}

/** card de lançamentos: filtro por categoria, lista (até 10) e botão "ver mais" */
export function TransactionsCard({ txs, cats, catFilter, onCatFilter, onDelete, onUpdate, onShowAll }: Props) {
  const extra = txs.length - 10

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="ttl">&gt;_ lançamentos</h2>
        <select className="cat-filter" value={catFilter} onChange={(e) => onCatFilter(e.target.value)}>
          <option value="">todas categorias</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {txs.length === 0 && <p className="muted small">nenhum lançamento nesse filtro.</p>}
      <TxList txs={txs.slice(0, 10)} cats={cats} onDelete={onDelete} onUpdate={onUpdate} />
      {extra > 0 && (
        <button type="button" className="btn ver-mais" onClick={onShowAll}>
          ver mais {extra} lançamento{extra > 1 ? 's' : ''} →
        </button>
      )}
    </section>
  )
}
