import { useState } from 'react'
import { Icon } from './Icon'
import { BLOCK_LABELS, DEFAULT_ORDER, type BlockKey } from '../lib/customization'

export function Customize({
  order,
  onClose,
  onSave,
}: {
  order: BlockKey[]
  onClose: () => void
  onSave: (order: BlockKey[]) => void
}) {
  const [orderDraft, setOrderDraft] = useState<BlockKey[]>(order)

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= orderDraft.length) return
    const next = [...orderDraft]
    ;[next[i], next[j]] = [next[j], next[i]]
    setOrderDraft(next)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="ttl">&gt;_ customização</h2>
          <button className="x" onClick={onClose} title="fechar">
            ×
          </button>
        </div>
        <p className="muted small">arraste a ordem das seções com as setas — fica salvo neste aparelho.</p>

        <div className="set-section">
          <span className="set-label">// ordem das seções</span>
          <ul className="reorder">
            {orderDraft.map((k, i) => (
              <li key={k} className="reorder-item">
                <span className="reorder-grip" aria-hidden="true">
                  ⠿
                </span>
                <span className="reorder-name">{BLOCK_LABELS[k]}</span>
                <div className="reorder-btns">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    aria-label={`subir ${BLOCK_LABELS[k]}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === orderDraft.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label={`descer ${BLOCK_LABELS[k]}`}
                  >
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="modal-foot">
          <button type="button" className="link" onClick={() => setOrderDraft([...DEFAULT_ORDER])}>
            restaurar ordem padrão
          </button>
          <div>
            <button type="button" className="icon-btn" onClick={onClose} title="cancelar" aria-label="cancelar">
              <Icon name="x" />
            </button>
            <button
              className="btn primary"
              onClick={() => onSave(orderDraft)}
              title="salvar"
              aria-label="salvar"
            >
              <Icon name="save" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
