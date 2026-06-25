import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { brl } from '../../lib/format'
import type { PieSlice } from '../../lib/finance'

type Props = { data: PieSlice[]; periodLabel: string }
type ChartType = 'pizza' | 'barras' | 'lista'

const STORE_KEY = 'fin-chart'
const tooltipStyle = { background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--txt)' }

/** gráfico de gastos por categoria — alterna entre pizza, barras e lista (ranking) */
export function CategoryChart({ data, periodLabel }: Props) {
  const [type, setType] = useState<ChartType>(() => {
    const v = localStorage.getItem(STORE_KEY)
    return v === 'barras' || v === 'lista' ? v : 'pizza'
  })
  function pick(t: ChartType) {
    setType(t)
    try {
      localStorage.setItem(STORE_KEY, t)
    } catch {
      /* ignora */
    }
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const max = data.length ? data[0].value : 1
  const pctOf = (v: number) => (total ? Math.round((v / total) * 100) : 0)

  return (
    <section className="card chart-card">
      <div className="card-head">
        <h2 className="ttl">&gt;_ gastos por categoria · {periodLabel}</h2>
        <div className="chips chart-chips">
          {(['pizza', 'barras', 'lista'] as const).map((t) => (
            <button key={t} type="button" className={'chip' + (type === t ? ' active' : '')} onClick={() => pick(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={'chart-body' + (type === 'pizza' ? ' centered' : '')}>
        {!data.length ? (
        <p className="muted small">sem gastos nesse período ainda</p>
      ) : type === 'pizza' ? (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} stroke="var(--bg)" />
              ))}
            </Pie>
            <Tooltip formatter={(value) => brl(Number(value))} contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      ) : type === 'barras' ? (
        <ResponsiveContainer width="100%" height={Math.max(170, data.length * 34)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 14, bottom: 4, left: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={88}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted)' }}
              tickFormatter={(n: string) => (n.length > 12 ? n.slice(0, 11) + '…' : n)}
            />
            <Tooltip
              formatter={(value) => brl(Number(value))}
              contentStyle={tooltipStyle}
              cursor={{ fill: 'var(--line)', fillOpacity: 0.25 }}
            />
            <Bar dataKey="value" radius={[0, 5, 5, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ul className="rank">
          {data.map((d) => (
            <li key={d.name} className="rank-row">
              <div className="rank-top">
                <span className="rank-name">
                  <span className="rank-dot" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="rank-val">
                  {brl(d.value)} <span className="muted">{pctOf(d.value)}%</span>
                </span>
              </div>
              <div className="rank-bar">
                <div className="rank-fill" style={{ width: (d.value / max) * 100 + '%', background: d.color }} />
              </div>
            </li>
          ))}
        </ul>
      )}
      </div>
    </section>
  )
}
