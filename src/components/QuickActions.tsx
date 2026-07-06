import { useRef, useState } from 'react'
import { Icon } from './Icon'
import { useDismissable } from '../hooks/useDismissable'
import { CalcPanel } from './Calculator'

/** botão flutuante "+" que abre um leque de atalhos (notas / calculadora) acima dele */
export function QuickActions({
  showCalc,
  showNotes,
  onNotes,
}: {
  showCalc: boolean
  showNotes: boolean
  onNotes: () => void
}) {
  const [menu, setMenu] = useState(false)
  const [calc, setCalc] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismissable(menu || calc, ref, () => {
    setMenu(false)
    setCalc(false)
  })

  const open = menu || calc

  return (
    <div className="qa-wrap" ref={ref}>
      {calc && <CalcPanel />}

      {menu && (
        <div className="qa-menu" role="menu">
          {showNotes && (
            <button
              type="button"
              className="qa-item"
              role="menuitem"
              onClick={() => {
                setMenu(false)
                onNotes()
              }}
            >
              <Icon name="note" /> notas
            </button>
          )}
          {showCalc && (
            <button
              type="button"
              className="qa-item"
              role="menuitem"
              onClick={() => {
                setMenu(false)
                setCalc(true)
              }}
            >
              <Icon name="calculator" /> calculadora
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        className={'qa-fab' + (open ? ' open' : '')}
        title="atalhos"
        aria-label="atalhos"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => {
          if (calc) {
            setCalc(false)
            return
          }
          setMenu((m) => !m)
        }}
      >
        +
      </button>
    </div>
  )
}
