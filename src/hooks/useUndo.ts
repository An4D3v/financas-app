import { useEffect, useRef, useState } from 'react'

export const UNDO_DURATION = 5000 // ms até a exclusão virar definitiva

type Pending = { id: number; message: string; onUndo: () => void }

/** mostra um toast "desfazer" por alguns segundos; some sozinho (a exclusão já foi pro banco) */
export function useUndo() {
  const [pending, setPending] = useState<Pending | null>(null)
  const timer = useRef<number | null>(null)
  const seq = useRef(0)

  function show(message: string, onUndo: () => void) {
    if (timer.current) clearTimeout(timer.current)
    const id = ++seq.current
    setPending({ id, message, onUndo })
    timer.current = window.setTimeout(() => setPending((p) => (p && p.id === id ? null : p)), UNDO_DURATION)
  }

  function undo() {
    if (timer.current) clearTimeout(timer.current)
    pending?.onUndo()
    setPending(null)
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return { pending, show, undo }
}
