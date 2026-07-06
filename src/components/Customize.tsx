import { useState } from 'react'
import { Icon } from './Icon'
import { BLOCK_LABELS, DEFAULT_ORDER, type BlockKey } from '../lib/customization'

export function Customize({
  caret,
  calc,
  notesEnabled,
  order,
  onClose,
  onSave,
}: {
  caret: boolean
  calc: boolean
  notesEnabled: boolean
  order: BlockKey[]
  onClose: () => void
  onSave: (data: { caret: boolean; calc: boolean; notesEnabled: boolean; order: BlockKey[] }) => void
}) {
  const [caretDraft, setCaretDraft] = useState(caret)
  const [calcDraft, setCalcDraft] = useState(calc)
  const [notesDraft, setNotesDraft] = useState(notesEnabled)
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
        <p className="muted small">deixa o painel com a sua cara — fica salvo neste aparelho.</p>

        <div className="set-section">
          <span className="set-label">// cursor piscando</span>
          <div className="switch-row">
            <span className="muted small">o bloco verde que pisca na marca do topo</span>
            <button
              type="button"
              role="switch"
              aria-checked={caretDraft}
              aria-label="cursor piscando"
              className={'switch' + (caretDraft ? ' on' : '')}
              onClick={() => setCaretDraft((v) => !v)}
            >
              <span className="knob" />
            </button>
          </div>
        </div>

        <div className="set-section">
          <span className="set-label">// atalho: calculadora</span>
          <div className="switch-row">
            <span className="muted small">mostra a calculadora no botão de atalhos (+)</span>
            <button
              type="button"
              role="switch"
              aria-checked={calcDraft}
              aria-label="atalho de calculadora"
              className={'switch' + (calcDraft ? ' on' : '')}
              onClick={() => setCalcDraft((v) => !v)}
            >
              <span className="knob" />
            </button>
          </div>
        </div>

        <div className="set-section">
          <span className="set-label">// atalho: anotações</span>
          <div className="switch-row">
            <span className="muted small">mostra as anotações no botão de atalhos (+)</span>
            <button
              type="button"
              role="switch"
              aria-checked={notesDraft}
              aria-label="atalho de anotações"
              className={'switch' + (notesDraft ? ' on' : '')}
              onClick={() => setNotesDraft((v) => !v)}
            >
              <span className="knob" />
            </button>
          </div>
        </div>

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
              onClick={() => onSave({ caret: caretDraft, calc: calcDraft, notesEnabled: notesDraft, order: orderDraft })}
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
