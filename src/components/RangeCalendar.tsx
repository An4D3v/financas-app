import { useState } from 'react'

const WD = ['d', 's', 't', 'q', 'q', 's', 's']
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const ymd = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const br = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7)

export function RangeCalendar({
  from,
  to,
  max,
  onApply,
  onClose,
}: {
  from: string
  to: string
  max: string // hoje (YYYY-MM-DD) — nao deixa escolher futuro
  onApply: (from: string, to: string) => void
  onClose: () => void
}) {
  const init = from || max
  const [vy, setVy] = useState(Number(init.slice(0, 4)))
  const [vm, setVm] = useState(Number(init.slice(5, 7)) - 1)
  const [start, setStart] = useState<string | null>(from || null)
  const [end, setEnd] = useState<string | null>(to || null)

  const maxY = Number(max.slice(0, 4))
  const maxM = Number(max.slice(5, 7)) - 1
  const canNext = vy < maxY || (vy === maxY && vm < maxM)

  function prevMonth() {
    if (vm === 0) {
      setVy(vy - 1)
      setVm(11)
    } else setVm(vm - 1)
  }
  function nextMonth() {
    if (!canNext) return
    if (vm === 11) {
      setVy(vy + 1)
      setVm(0)
    } else setVm(vm + 1)
  }

  function clickDay(ds: string) {
    if (ds > max) return
    if (!start || (start && end)) {
      setStart(ds)
      setEnd(null)
    } else {
      let a = start
      let b = ds
      if (b < a) [a, b] = [b, a]
      setStart(a)
      setEnd(b)
      // nao aplica direto — deixa a Ana ver a selecao e clicar em salvar
    }
  }

  const firstDow = new Date(ymd(vy, vm, 1) + 'T00:00:00').getDay()
  const daysInMonth = new Date(vy, vm + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="cal" onClick={(e) => e.stopPropagation()}>
      <div className="cal-head">
        <button type="button" className="cal-nav" onClick={prevMonth} aria-label="mes anterior">
          ‹
        </button>
        <span className="cal-title">
          {MONTHS[vm]} {vy}
        </span>
        <button
          type="button"
          className={'cal-nav' + (canNext ? '' : ' off')}
          onClick={nextMonth}
          disabled={!canNext}
          aria-label="proximo mes"
        >
          ›
        </button>
      </div>

      <div className="cal-grid cal-wd">
        {WD.map((w, i) => (
          <span key={i} className="cal-wdc">
            {w}
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d == null) return <span key={i} className="cal-cell empty" />
          const ds = ymd(vy, vm, d)
          const future = ds > max
          const isEdge = ds === start || ds === end
          const between = start && end ? ds > start && ds < end : false
          const cls = 'cal-cell' + (future ? ' off' : '') + (isEdge ? ' sel' : between ? ' between' : '')
          return (
            <button key={i} type="button" className={cls} disabled={future} onClick={() => clickDay(ds)}>
              {d}
            </button>
          )
        })}
      </div>

      <div className="cal-foot">
        <span className={'small cal-range' + (start && end ? ' ok' : '')}>
          {start ? (end ? `${br(start)} → ${br(end)}` : `${br(start)} → escolha o fim`) : 'clique no dia inicial'}
        </span>
        <div>
          <button type="button" className="link" onClick={onClose}>
            fechar
          </button>
          <button
            type="button"
            className="btn primary cal-apply"
            disabled={!start}
            onClick={() => start && onApply(start, end || start)}
          >
            salvar
          </button>
        </div>
      </div>
    </div>
  )
}
