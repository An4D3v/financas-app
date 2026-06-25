import { brl } from '../../lib/format'
import type { Insights, Period } from '../../lib/finance'

type Props = {
  insights: Insights
  saldo: number
  gastos: number
  period: Period
  periodLabel: string
  hasPeriodTxs: boolean
}

/** card de resumo: insights legíveis sobre o período (poupança, top categoria, comparação...) */
export function Summary({ insights, saldo, gastos, period, periodLabel, hasPeriodTxs }: Props) {
  return (
    <section className="card">
      <h2 className="ttl">&gt;_ resumo · {periodLabel}</h2>
      {!hasPeriodTxs ? (
        <p className="muted small">sem lançamentos nesse período pra resumir ainda.</p>
      ) : (
        <ul className="insights">
          {insights.savingRate != null && (
            <li className="insight">
              <span className="ins-ico">{saldo >= 0 ? '💰' : '⚠️'}</span>
              {saldo >= 0 ? (
                <span>
                  você guardou <b className="green">{insights.savingRate.toFixed(0)}%</b> da sua renda nesse período
                </span>
              ) : (
                <span>
                  atenção: gastou <b className="red">{brl(-saldo)}</b> a mais do que ganhou
                </span>
              )}
            </li>
          )}
          {insights.top && (
            <li className="insight">
              <span className="ins-ico">📊</span>
              <span>
                <b style={{ color: insights.top.color }}>{insights.top.name}</b> é seu maior gasto:{' '}
                <b className="pink">{brl(insights.top.value)}</b>{' '}
                <span className="muted">({insights.topPct.toFixed(0)}% do total)</span>
              </span>
            </li>
          )}
          {gastos > 0 && period !== 'dia' && (
            <li className="insight">
              <span className="ins-ico">📅</span>
              <span>
                média de <b className="cyan">{brl(insights.dailyAvg)}</b> por dia em gastos
              </span>
            </li>
          )}
          {insights.pct != null && (
            <li className="insight">
              <span className="ins-ico">{insights.pct > 0 ? '📈' : insights.pct < 0 ? '📉' : '➖'}</span>
              {insights.pct > 0 ? (
                <span>
                  você gastou <b className="red">{insights.pct.toFixed(0)}% a mais</b> que {insights.prevLabel}
                </span>
              ) : insights.pct < 0 ? (
                <span>
                  boa! <b className="green">{Math.abs(insights.pct).toFixed(0)}% a menos</b> que {insights.prevLabel}
                </span>
              ) : (
                <span>gasto igual ao de {insights.prevLabel}</span>
              )}
            </li>
          )}
          {insights.biggest && (
            <li className="insight">
              <span className="ins-ico">🔝</span>
              <span>
                maior saída: <b>{insights.biggest.description}</b> ·{' '}
                <b className="pink">{brl(Number(insights.biggest.amount))}</b>
              </span>
            </li>
          )}
        </ul>
      )}
    </section>
  )
}
