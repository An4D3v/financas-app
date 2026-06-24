import { useRef } from 'react'
import type { Category, Transaction } from '../types'
import { TxList, type TxPatch } from './TxList'
import { ScrollTopButton } from './ScrollTopButton'

export function TxModal({
  txs,
  cats,
  onDelete,
  onUpdate,
  onClose,
}: {
  txs: Transaction[]
  cats: Category[]
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: TxPatch) => void
  onClose: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal tx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="ttl">
            &gt;_ todos os lancamentos <span className="muted small">({txs.length})</span>
          </h2>
          <button className="x" onClick={onClose} title="fechar">
            ×
          </button>
        </div>
        <div className="tx-scroll" ref={scrollRef}>
          <TxList txs={txs} cats={cats} onDelete={onDelete} onUpdate={onUpdate} />
        </div>
        <ScrollTopButton target={scrollRef} className="in-modal" />
      </div>
    </div>
  )
}
