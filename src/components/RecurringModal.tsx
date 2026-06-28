import { useState } from 'react'
import { brl } from '../lib/format'
import { Icon } from './Icon'
import type { Category, Recurring } from '../types'
import type { NewRecurring } from '../hooks/useFinanceData'

export function RecurringModal({
  cats,
  recurring,
  onAdd,
  onToggle,
  onDelete,
  onClose,
}: {
  cats: Category[]
  recurring: Recurring[]
  onAdd: (data: NewRecurring) => Promise<string | null>
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'entrada' | 'saida'>('saida')
  const [catId, setCatId] = useState('')
  const [day, setDay] = useState('5')
  const [saving, setSaving] = useState(false)

  const catName = (id: string | null) => (id ? cats.find((c) => c.id === id)?.name : null)

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
        <p className="muted small">lançamentos que se repetem todo mês — o app cria sozinho no dia certo.</p>

        {recurring.length > 0 && (
          <ul className="rec-list review-rows">
            {recurring.map((r) => (
              <li key={r.id} className={'rec-item' + (r.active ? '' : ' off')}>
                <span className={'tx-type ' + (r.type === 'entrada' ? 'is-in' : 'is-out')} aria-hidden="true">
                  {r.type === 'entrada' ? '+' : '−'}
                </span>
                <span className="rec-desc">
                  {r.description} <small className="muted">dia {r.day_of_month}{catName(r.category_id) ? ' · ' + catName(r.category_id) : ''}</small>
                </span>
                <span className="rec-val">{brl(r.amount)}</span>
                <button
                  type="button"
                  className={'switch sm' + (r.active ? ' on' : '')}
                  onClick={() => onToggle(r.id, !r.active)}
                  title={r.active ? 'ativa — clique p/ pausar' : 'pausada — clique p/ ativar'}
                  aria-label="ativar ou pausar"
                >
                  <span className="knob" />
                </button>
                <button className="x" onClick={() => onDelete(r.id)} title="excluir">
                  ×
                </button>
              </li>
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
            <input
              type="number"
              min={1}
              max={28}
              placeholder="dia"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
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
