import { brl } from '../../lib/format'

type Props = { renda: number; gastos: number; saldo: number; periodLabel: string }

/** os três indicadores do topo: renda, gastos e saldo do período */
export function Kpis({ renda, gastos, saldo, periodLabel }: Props) {
  return (
    <section className="kpis">
      <div className="kpi">
        <span className="lbl">// renda · {periodLabel}</span>
        <span className="val cyan">{brl(renda)}</span>
      </div>
      <div className="kpi">
        <span className="lbl">// gastos · {periodLabel}</span>
        <span className="val pink">{brl(gastos)}</span>
      </div>
      <div className="kpi">
        <span className="lbl">// saldo · {periodLabel}</span>
        <span className={'val ' + (saldo < 0 ? 'red' : 'green')}>{brl(saldo)}</span>
      </div>
    </section>
  )
}
