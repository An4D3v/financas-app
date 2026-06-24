import { useEffect, useState, type RefObject } from 'react'

// setinha "voltar ao topo": some/aparece conforme o scroll. So aparece no mobile (CSS).
// Sem target -> escuta o scroll da janela (app). Com target -> escuta um container (popup).
export function ScrollTopButton({
  target,
  className = '',
}: {
  target?: RefObject<HTMLDivElement | null>
  className?: string
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = target?.current ?? null
    const scroller: HTMLElement | Window = el ?? window
    const top = () => (el ? el.scrollTop : window.scrollY)
    const onScroll = () => setShow(top() > 240)
    scroller.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [target])

  if (!show) return null

  function toTop() {
    const el = target?.current
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button className={'scroll-top ' + className} onClick={toTop} aria-label="voltar ao topo" title="voltar ao topo">
      ↑
    </button>
  )
}
