import { useRef, useState } from 'react'
import { Icon } from './Icon'
import { useDismissable } from '../hooks/useDismissable'

const KEYS = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
]

function op(a: number, b: number, o: string): number {
  let r: number
  if (o === '+') r = a + b
  else if (o === '−') r = a - b
  else if (o === '×') r = a * b
  else r = a / b
  return Math.round(r * 1e10) / 1e10 // tira o ruído de ponto flutuante
}

const fmt = (n: number) => (Number.isFinite(n) ? String(n) : 'erro')

/** mini calculadora flutuante (botão semitransparente no canto inferior esquerdo) */
export function CalcWidget() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismissable(open, ref, () => setOpen(false))

  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState<number | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [fresh, setFresh] = useState(true) // próximo dígito recomeça o visor

  function digit(d: string) {
    setDisplay((c) => (fresh || c === '0' || c === 'erro' ? d : c + d))
    setFresh(false)
  }
  function dot() {
    setDisplay((c) => (fresh || c === 'erro' ? '0.' : c.includes('.') ? c : c + '.'))
    setFresh(false)
  }
  function clearAll() {
    setDisplay('0')
    setPrev(null)
    setPending(null)
    setFresh(true)
  }
  function back() {
    if (fresh) return
    setDisplay((c) => (c.length <= 1 ? '0' : c.slice(0, -1)))
  }
  function chooseOp(o: string) {
    const cur = parseFloat(display)
    if (prev != null && pending && !fresh) {
      const r = op(prev, cur, pending)
      setPrev(r)
      setDisplay(fmt(r))
    } else {
      setPrev(cur)
    }
    setPending(o)
    setFresh(true)
  }
  function equals() {
    if (pending == null || prev == null) return
    const r = op(prev, parseFloat(display), pending)
    setDisplay(fmt(r))
    setPrev(null)
    setPending(null)
    setFresh(true)
  }
  function press(k: string) {
    if (k === 'C') clearAll()
    else if (k === '⌫') back()
    else if (k === '%') {
      setDisplay((c) => fmt(parseFloat(c) / 100))
      setFresh(true)
    } else if (k === '=') equals()
    else if ('+−×÷'.includes(k)) chooseOp(k)
    else if (k === '.') dot()
    else digit(k)
  }

  return (
    <div className="calc-wrap" ref={ref}>
      {open && (
        <div className="calc-panel" role="dialog" aria-label="calculadora">
          <div className="calc-display">{display}</div>
          <div className="calc-grid">
            {KEYS.flat().map((k) => (
              <button
                key={k}
                type="button"
                className={
                  'calc-key' +
                  (k === '0' ? ' wide' : '') +
                  ('+−×÷='.includes(k) ? ' op' : '') +
                  (k === 'C' ? ' clear' : '')
                }
                onClick={() => press(k)}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        className="calc-fab"
        title="calculadora"
        aria-label="calculadora"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="calculator" />
      </button>
    </div>
  )
}
