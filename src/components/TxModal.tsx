import { useRef } from 'react'
import type { Transaction } from '../types'
import { TxList } from './TxList'
import { ScrollTopButton } from './ScrollTopButton'

export function TxModal({
  txs,
  onDelete,
  onClose,
}: {
  txs: Transaction[]
  onDelete: (id: string) => void
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
          <TxList txs={txs} onDelete={onDelete} />
        </div>
        <ScrollTopButton target={scrollRef} className="in-modal" />
      </div>
    </div>
  )
}
