import { useState } from 'react'
import { brl, maskMoney } from '../lib/format'
import { Icon } from './Icon'
import type { Category, ReviewRow } from '../types'

export function ScanReview({
  merchant,
  date,
  items,
  categories,
  onCancel,
  onConfirm,
}: {
  merchant: string
  date: string
  items: ReviewRow[]
  categories: Category[]
  onCancel: () => void
  onConfirm: (rows: ReviewRow[], date: string) => Promise<void>
}) {
  const [rows, setRows] = useState<ReviewRow[]>(() => items.map((r) => ({ ...r, value: maskMoney(r.value) })))
  const [d, setD] = useState(date)
  const [saving, setSaving] = useState(false)

  const num = (v: string) => Number(v.replace(',', '.')) || 0
  const out = rows.filter((r) => r.type === 'saida').reduce((s, r) => s + num(r.value), 0)
  const inc = rows.filter((r) => r.type === 'entrada').reduce((s, r) => s + num(r.value), 0)
  const hasIn = inc > 0

  function update(i: number, patch: Partial<ReviewRow>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function remove(i: number) {
    setRows((rs) => rs.filter((_, idx) => idx !== i))
  }
  async function confirm() {
    setSaving(true)
    await onConfirm(rows, d)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="ttl">&gt;_ revisar nota{merchant ? ' · ' + merchant : ''}</h2>
          <button className="x" onClick={onCancel} title="fechar">
            ×
          </button>
        </div>
        <p className="muted small">
          {rows.length === 1 ? '1 valor encontrado' : rows.length + ' valores encontrados'}. confere, edita ou remove antes de adicionar.
        </p>
        <div className="row" style={{ marginBottom: 8 }}>
          <label className="muted small" style={{ flex: 'none', alignSelf: 'center' }}>
            data:
          </label>
          <input type="date" value={d} onChange={(e) => setD(e.target.value)} />
        </div>
        <div className="review-rows">
          {rows.map((r, i) => (
            <div key={i} className="review-row">
              <button
                type="button"
                className={'rev-type ' + (r.type === 'entrada' ? 'is-in' : 'is-out')}
                onClick={() => update(i, { type: r.type === 'entrada' ? 'saida' : 'entrada' })}
                title={r.type === 'entrada' ? 'entrada (receita) — clique p/ saída' : 'saída (gasto) — clique p/ entrada'}
                aria-pressed={r.type === 'entrada'}
              >
                <span className="dot" />
                {r.type === 'entrada' ? 'entrada' : 'saída'}
              </button>
              <input
                className="rev-desc"
                placeholder="descrição"
                value={r.description}
                onChange={(e) => update(i, { description: e.target.value })}
              />
              <select value={r.categoryId} onChange={(e) => update(i, { categoryId: e.target.value })}>
                <option value="">categoria...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="money rev-val">
                <span className="money-pre">R$</span>
                <input
                  inputMode="decimal"
                  placeholder="0,00"
                  aria-label="valor"
                  value={r.value}
                  onChange={(e) => update(i, { value: e.target.value })}
                  onBlur={() => update(i, { value: maskMoney(r.value) })}
                />
              </div>
              <button className="x" onClick={() => remove(i)} title="remover">
                ×
              </button>
            </div>
          ))}
          {rows.length === 0 && <p className="muted small">nenhum item. cancela e tenta outra foto.</p>}
        </div>
        <div className="modal-foot">
          {hasIn ? (
            <span className="muted small">
              saídas <b className="pink">{brl(out)}</b> · entradas <b className="green">{brl(inc)}</b>
            </span>
          ) : (
            <span className="muted small">
              total: <b className="cyan">{brl(out)}</b>
            </span>
          )}
          <div>
            <button type="button" className="link" onClick={onCancel}>
              <Icon name="x" /> cancelar
            </button>
            <button className="btn primary" disabled={saving || rows.length === 0} onClick={confirm}>
              {saving ? (
                '...'
              ) : (
                <>
                  <Icon name="plus" /> adicionar {rows.length}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
