import { useEffect, useRef, type RefObject } from 'react'

/**
 * Fecha um popover (menu, calendário) ao clicar fora do elemento `ref`
 * ou ao apertar Esc. Só fica ativo enquanto `open` for true.
 */
export function useDismissable<T extends HTMLElement>(
  open: boolean,
  ref: RefObject<T | null>,
  onClose: () => void,
) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onCloseRef.current()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, ref])
}
