import { useState, type KeyboardEvent } from 'react'
import { brl } from '../lib/format'
import { Icon } from './Icon'
import type { Category, Recurring } from '../types'
import type { NewRecurring } from '../hooks/useFinanceData'

type RecPatch = Partial<NewRecurring> & { active?: boolean }
type Field = 'desc' | 'amount' | 'day' | 'cat' | null

/** uma conta fixa com edição inline (clique no campo pra alterar — igual aos lançamentos) */
function RecRow({
  r,
  cats,
  onUpdate,
  onDelete,
}: {
  r: Recurring
  cats: Category[]
  onUpdate: (id: string, patch: RecPatch) => void
  onDelete: (id: string) => void
}) {
  const [edit, setEdit] = useState<Field>(null)
  const [draft, setDraft] = useState('')
  const catName = r.category_id ? cats.find((c) => c.id === r.category_id)?.name : null

  function start(field: 'desc' | 'amount' | 'day', value: string) {
    setDraft(value)
    setEdit(field)
  }
  function commit() {
    if (edit === 'desc') {
      const v = draft.trim()
      if (v && v !== r.description) onUpdate(r.id, { description: v })
    } else if (edit === 'amount') {
      const v = Number(draft.replace(',', '.'))
      if (v > 0 && v !== r.amount) onUpdate(r.id, { amount: v })
    } else if (edit === 'day') {
      const v = Number(draft)
      if (v >= 1 && v <= 28 && v !== r.day_of_month) onUpdate(r.id, { day_of_month: v })
    }
    setEdit(null)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') commit()
    else if (e.key === 'Escape') setEdit(null)
  }

  return (
    <li className={'rec-item' + (r.active ? '' : ' off')}>
      <button
        type="button"
        className={'tx-type ' + (r.type === 'entrada' ? 'is-in' : 'is-out')}
        title={r.type === 'entrada' ? 'entrada — clique p/ saída' : 'saída — clique p/ entrada'}
        onClick={() => onUpdate(r.id, { type: r.type === 'entrada' ? 'saida' : 'entrada' })}
      >
        {r.type === 'entrada' ? '+' : '−'}
      </button>

      <span className="rec-desc">
        {edit === 'desc' ? (
          <input
            className="tx-edit tx-edit-desc"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKey}
          />
        ) : (
          <span className="editable" title="editar nome" onClick={() => start('desc', r.description)}>
            {r.description}
          </span>
        )}{' '}
        <small className="muted">
          dia{' '}
          {edit === 'day' ? (
            <input
              className="tx-edit"
              style={{ width: 46 }}
              type="number"
              min={1}
              max={28}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={onKey}
            />
          ) : (
            <span className="editable" title="editar dia" onClick={() => start('day', String(r.day_of_month))}>
              {r.day_of_month}
            </span>
          )}
          {' · '}
          {edit === 'cat' ? (
            <select
              className="tx-edit tx-edit-cat"
              autoFocus
              value={r.category_id ?? ''}
              onChange={(e) => {
                onUpdate(r.id, { category_id: e.target.value || null })
                setEdit(null)
              }}
              onBlur={() => setEdit(null)}
            >
              <option value="">sem categoria</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="editable" title="editar categoria" onClick={() => setEdit('cat')}>
              {catName ?? 'sem categoria'}
            </span>
          )}
        </small>
      </span>

      {edit === 'amount' ? (
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
          className="rec-val editable"
          title="editar valor"
          onClick={() => start('amount', Number(r.amount).toFixed(2).replace('.', ','))}
        >
          {brl(r.amount)}
        </span>
      )}

      <button
        type="button"
        className={'switch sm' + (r.active ? ' on' : '')}
        onClick={() => onUpdate(r.id, { active: !r.active })}
        title={r.active ? 'ativa — clique p/ pausar' : 'pausada — clique p/ ativar'}
        aria-label="ativar ou pausar"
      >
        <span className="knob" />
      </button>
      <button className="x" onClick={() => onDelete(r.id)} title="excluir">
        ×
      </button>
    </li>
  )
}

export function RecurringModal({
  cats,
  recurring,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: {
  cats: Category[]
  recurring: Recurring[]
  onAdd: (data: NewRecurring) => Promise<string | null>
  onUpdate: (id: string, patch: RecPatch) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'entrada' | 'saida'>('saida')
  const [catId, setCatId] = useState('')
  const [day, setDay] = useState('5')
  const [saving, setSaving] = useState(false)

  async function add() {
    const valor = Number(amount.replace(',', '.'))
    const d = Number(day)
    if (!desc.trim() || !valor || valor <= 0 || !(d >= 1 && d <= 28)) return
    setSaving(true)
    const err = await onAdd({ description: desc.trim(), amount: valor, type, category_id: catId || null, day_of_month: d })
    setSaving(false)
    if (err) {
      alert(err)
      return
    }
    setDesc('')
    setAmount('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="ttl">&gt;_ contas fixas</h2>
          <button className="x" onClick={onClose} title="fechar">
            ×
          </button>
        </div>
        <p className="muted small">repetem todo mês — o app cria sozinho no dia. clique em qualquer campo pra editar.</p>

        {recurring.length > 0 && (
          <ul className="rec-list review-rows">
            {recurring.map((r) => (
              <RecRow key={r.id} r={r} cats={cats} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </ul>
        )}

        <div className="set-section">
          <span className="set-label">// nova conta fixa</span>
          <input placeholder="descrição (ex: aluguel, netflix)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="row">
            <select value={type} onChange={(e) => setType(e.target.value as 'entrada' | 'saida')}>
              <option value="saida">saída</option>
              <option value="entrada">entrada</option>
            </select>
            <input inputMode="decimal" placeholder="valor R$" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="row">
            <select value={catId} onChange={(e) => setCatId(e.target.value)}>
              <option value="">categoria...</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input type="number" min={1} max={28} placeholder="dia" value={day} onChange={(e) => setDay(e.target.value)} />
          </div>
        </div>

        <div className="modal-foot">
          <span className="muted small">repete todo mês no dia (1–28)</span>
          <button className="btn primary" disabled={saving} onClick={add} title="adicionar" aria-label="adicionar">
            {saving ? (
              '...'
            ) : (
              <>
                <Icon name="plus" /> adicionar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
