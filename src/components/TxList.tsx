import { useState, type KeyboardEvent } from 'react'
import type { Category, Transaction } from '../types'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export type TxPatch = Partial<Pick<Transaction, 'description' | 'category_id' | 'amount' | 'occurred_on'>>

type Field = 'date' | 'desc' | 'cat' | 'val' | null

function TxRow({
  tx,
  cats,
  onDelete,
  onUpdate,
}: {
  tx: Transaction
  cats: Category[]
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: TxPatch) => void
}) {
  const [edit, setEdit] = useState<Field>(null)
  const [draft, setDraft] = useState('')

  function start(field: 'date' | 'desc' | 'val', value: string) {
    setDraft(value)
    setEdit(field)
  }
  function cancel() {
    setEdit(null)
  }
  function commit() {
    if (edit === 'desc') {
      const v = draft.trim()
      if (v && v !== tx.description) onUpdate(tx.id, { description: v })
    } else if (edit === 'val') {
      const v = Number(draft.replace(',', '.'))
      if (v > 0 && v !== Number(tx.amount)) onUpdate(tx.id, { amount: v })
    } else if (edit === 'date') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(draft) && draft !== tx.occurred_on) onUpdate(tx.id, { occurred_on: draft })
    }
    setEdit(null)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') commit()
    else if (e.key === 'Escape') cancel()
  }

  return (
    <li className="tx">
      <span className="dot" style={{ background: tx.categories?.color ?? '#8B949E' }} />

      {edit === 'date' ? (
        <input
          className="tx-edit tx-edit-date"
          type="date"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKey}
        />
      ) : (
        <span className="tx-date editable" title="editar data" onClick={() => start('date', tx.occurred_on)}>
          {tx.occurred_on.slice(8, 10)}/{tx.occurred_on.slice(5, 7)}
        </span>
      )}

      <span className="tx-desc">
        {edit === 'desc' ? (
          <input
            className="tx-edit tx-edit-desc"
            autoFocus
            value={draft}
            placeholder="descricao"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKey}
          />
        ) : (
          <span className="editable" title="editar nome" onClick={() => start('desc', tx.description)}>
            {tx.description}
          </span>
        )}{' '}
        {edit === 'cat' ? (
          <select
            className="tx-edit tx-edit-cat"
            autoFocus
            value={tx.category_id ?? ''}
            onChange={(e) => {
              onUpdate(tx.id, { category_id: e.target.value || null })
              setEdit(null)
            }}
            onBlur={cancel}
          >
            <option value="">sem categoria</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <small className="tx-cat editable" title="editar categoria" onClick={() => setEdit('cat')}>
            {tx.categories?.name ?? 'sem categoria'}
          </small>
        )}
      </span>

      {edit === 'val' ? (
        <input
          className="tx-edit tx-edit-val"
          inputMode="decimal"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKey}
        />
      ) : (
        <span
          className={'tx-val editable ' + (tx.type === 'entrada' ? 'green' : 'pink')}
          title="editar valor"
          onClick={() => start('val', Number(tx.amount).toFixed(2).replace('.', ','))}
        >
          {tx.type === 'entrada' ? '+' : '-'}
          {brl(Number(tx.amount))}
        </span>
      )}

      <button className="x" onClick={() => onDelete(tx.id)} title="excluir">
        ×
      </button>
    </li>
  )
}

export function TxList({
  txs,
  cats,
  onDelete,
  onUpdate,
}: {
  txs: Transaction[]
  cats: Category[]
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: TxPatch) => void
}) {
  return (
    <ul className="txs">
      {txs.map((t) => (
        <TxRow key={t.id} tx={t} cats={cats} onDelete={onDelete} onUpdate={onUpdate} />
      ))}
    </ul>
  )
}
