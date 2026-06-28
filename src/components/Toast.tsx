import { Icon } from './Icon'

/** toast de "desfazer" fixo embaixo, com barrinha de contagem regressiva */
export function Toast({ message, onUndo }: { message: string; onUndo: () => void }) {
  return (
    <div className="toast" role="status">
      <span className="toast-msg">{message}</span>
      <button type="button" className="toast-undo" onClick={onUndo}>
        <Icon name="undo" /> desfazer
      </button>
      <span className="toast-bar" />
    </div>
  )
}
