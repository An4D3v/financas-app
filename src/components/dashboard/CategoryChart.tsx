import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { brl } from '../../lib/format'
import type { PieSlice } from '../../lib/finance'

type Props = { data: PieSlice[]; periodLabel: string }

/** gráfico de pizza dos gastos por categoria */
export function CategoryChart({ data, periodLabel }: Props) {
  return (
    <section className="card">
      <h2 className="ttl">&gt;_ gastos por categoria · {periodLabel}</h2>
      {data.length ? (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} stroke="var(--bg)" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => brl(Number(value))}
              contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--txt)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="muted small">sem gastos nesse período ainda</p>
      )}
    </section>
  )
}
