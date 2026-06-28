import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts'
import { brl } from '../../lib/format'
import type { PieSlice, TimeSeries } from '../../lib/finance'

type Props = { data: PieSlice[]; timeSeries: TimeSeries; periodLabel: string }
type ChartType = 'pizza' | 'barras' | 'colunas' | 'linhas' | 'lista'

const STORE_KEY = 'fin-chart'
const tooltipStyle = { background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--txt)' }

/** gráfico de gastos por categoria — alterna entre pizza, barras e lista (ranking) */
export function CategoryChart({ data, timeSeries, periodLabel }: Props) {
  const [type, setType] = useState<ChartType>(() => {
    const v = localStorage.getItem(STORE_KEY)
    return v && ['barras', 'colunas', 'linhas', 'lista'].includes(v) ? (v as ChartType) : 'pizza'
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
          {(['pizza', 'barras', 'colunas', 'linhas', 'lista'] as const).map((t) => (
            <button key={t} type="button" className={'chip' + (type === t ? ' active' : '')} onClick={() => pick(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-body">
        <div className={'chart-inner' + (!data.length || type === 'pizza' || type === 'colunas' || type === 'linhas' ? ' centered' : '')}>
        {!data.length ? (
        <p className="muted small chart-empty">sem gastos nesse período ainda</p>
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
              formatter={(value) => [brl(Number(value)), '']}
              separator=""
              contentStyle={tooltipStyle}
              itemStyle={{ color: 'var(--txt)' }}
              labelStyle={{ color: 'var(--txt)' }}
              cursor={{ fill: 'var(--line)', fillOpacity: 0.25 }}
            />
            <Bar dataKey="value" radius={[0, 5, 5, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : type === 'colunas' ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <XAxis
              dataKey="name"
              interval={0}
              tickLine={false}
              axisLine={false}
              angle={-35}
              textAnchor="end"
              height={64}
              tick={{ fontSize: 10, fill: 'var(--muted)' }}
              tickFormatter={(n: string) => (n.length > 9 ? n.slice(0, 8) + '…' : n)}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value) => [brl(Number(value)), '']}
              separator=""
              contentStyle={tooltipStyle}
              itemStyle={{ color: 'var(--txt)' }}
              labelStyle={{ color: 'var(--txt)' }}
              cursor={{ fill: 'var(--line)', fillOpacity: 0.25 }}
            />
            <Bar dataKey="value" radius={[5, 5, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : type === 'linhas' ? (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={timeSeries.points} margin={{ top: 8, right: 14, bottom: 0, left: -12 }}>
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: 'var(--muted)' }}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value, name) => [brl(Number(value)), name]}
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'var(--txt)' }}
            />
            {timeSeries.lines.map((l) => (
              <Line
                key={l.name}
                type="monotone"
                dataKey={l.name}
                stroke={l.color}
                strokeWidth={2}
                dot={timeSeries.points.length <= 10 ? { r: 2, fill: l.color } : false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
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
      </div>
    </section>
  )
}
