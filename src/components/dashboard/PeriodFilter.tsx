import { useRef, useState } from 'react'
import { RangeCalendar } from '../RangeCalendar'
import { useDismissable } from '../../hooks/useDismissable'
import { brDate, todayStr } from '../../lib/format'
import type { Period } from '../../lib/finance'
import { Icon } from '../Icon'

type Props = {
  period: Period
  onPeriod: (p: Period) => void
  customFrom: string
  customTo: string
  onApplyRange: (from: string, to: string) => void
}

const CHIPS: { id: Period; label: string }[] = [
  { id: 'dia', label: 'dia' },
  { id: 'semana', label: 'semana' },
  { id: 'mes', label: 'mês' },
  { id: 'tudo', label: 'tudo' },
]

/** chips de período (dia/semana/mês/tudo) + calendário de intervalo personalizado */
export function PeriodFilter({ period, onPeriod, customFrom, customTo, onApplyRange }: Props) {
  const [calOpen, setCalOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismissable(calOpen, ref, () => setCalOpen(false))

  const rangeLabel =
    period === 'custom' && customFrom && customTo ? `${brDate(customFrom)}–${brDate(customTo)}` : 'período'

  return (
    <div className="filters">
      <div className="chips">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={'chip' + (period === c.id ? ' active' : '')}
            onClick={() => onPeriod(c.id)}
          >
            {c.label}
          </button>
        ))}
        <div className="cal-wrap" ref={ref}>
          <button
            type="button"
            className={'chip' + (period === 'custom' ? ' active' : '')}
            onClick={() => setCalOpen((o) => !o)}
          >
            <Icon name="calendar" /> {rangeLabel}
          </button>
          {calOpen && (
            <RangeCalendar
              from={customFrom}
              to={customTo}
              max={todayStr()}
              onApply={(f, t) => {
                onApplyRange(f, t)
                setCalOpen(false)
              }}
              onClose={() => setCalOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
