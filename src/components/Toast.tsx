import { Icon } from './Icon'

/** toast fixo embaixo com barrinha de contagem regressiva — com "desfazer" (exclusões) ou só o aviso (metas) */
export function Toast({ message, onUndo }: { message: string; onUndo?: () => void }) {
  return (
    <div className="toast" role="status">
      <span className="toast-msg">{message}</span>
      {onUndo && (
        <button type="button" className="toast-undo" onClick={onUndo}>
          <Icon name="undo" /> desfazer
        </button>
      )}
      <span className="toast-bar" />
    </div>
  )
}
