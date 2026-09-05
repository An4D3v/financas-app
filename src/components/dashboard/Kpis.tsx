import { brl } from '../../lib/format'

type Props = { renda: number; gastos: number; saldo: number; periodLabel: string }

/** os três indicadores do topo: renda, gastos e saldo do período */
export function Kpis({ renda, gastos, saldo, periodLabel }: Props) {
  return (
    <section className="kpis">
      <div className="kpi kpi-in">
        <span className="lbl">renda · {periodLabel}</span>
        <span className="val ok">{brl(renda)}</span>
      </div>
      <div className="kpi kpi-out">
        <span className="lbl">gastos · {periodLabel}</span>
        <span className="val bad">{brl(gastos)}</span>
      </div>
      <div className={'kpi ' + (saldo < 0 ? 'kpi-neg' : 'kpi-bal')}>
        <span className="lbl">saldo · {periodLabel}</span>
        <span className={'val ' + (saldo < 0 ? 'bad' : 'ok')}>{brl(saldo)}</span>
      </div>
    </section>
  )
}
