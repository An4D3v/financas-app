import { useState } from 'react'
import type { Category } from '../types'

export type ReviewRow = { description: string; value: string; categoryId: string }

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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
  const [rows, setRows] = useState<ReviewRow[]>(items)
  const [d, setD] = useState(date)
  const [saving, setSaving] = useState(false)

  const total = rows.reduce((s, r) => s + (Number(r.value.replace(',', '.')) || 0), 0)

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
          {rows.length === 1 ? '1 valor encontrado' : rows.length + ' valores encontrados'}. Confere, edita ou remove antes de adicionar.
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
              <input
                className="rev-desc"
                placeholder="descricao"
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
              <input
                className="rev-val"
                inputMode="decimal"
                placeholder="0,00"
                value={r.value}
                onChange={(e) => update(i, { value: e.target.value })}
              />
              <button className="x" onClick={() => remove(i)} title="remover">
                ×
              </button>
            </div>
          ))}
          {rows.length === 0 && <p className="muted small">nenhum item. cancela e tenta outra foto.</p>}
        </div>
        <div className="modal-foot">
          <span className="muted small">
            total: <b className="cyan">{brl(total)}</b>
          </span>
          <div>
            <button type="button" className="link" onClick={onCancel}>
              cancelar
            </button>
            <button className="btn primary" disabled={saving || rows.length === 0} onClick={confirm}>
              {saving ? '...' : 'Adicionar ' + rows.length}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
