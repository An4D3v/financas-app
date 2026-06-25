import { Icon, type IconName } from './Icon'

export function About({ isOwner, onClose }: { isOwner: boolean; onClose: () => void }) {
  const stack = [
    'react + typescript + vite',
    'supabase  (auth · postgres · rls)',
    'gemini    (leitura das notas)',
    'recharts  (gráficos)',
  ].join('\n')

  const feats: [IconName, string][] = [
    ['camera', 'escaneie a nota fiscal e lance no automático (ia)'],
    ['tag', 'categorias, filtros por período e calendário'],
    ['chart', 'resumo com insights dos seus gastos'],
    ['moon', 'tema claro / escuro'],
    ['download', 'exporte tudo em csv quando quiser'],
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="ttl">&gt;_ sobre</h2>
          <button className="x" onClick={onClose} title="fechar">
            ×
          </button>
        </div>

        <div className="about">
          <p className="about-title">
            finanças <span className="muted">v1.0</span>
          </p>

          {isOwner ? (
            <>
              <p className="muted small">
                seu dashboard de grana — 100% gratuito, feito por você <Icon name="heart" className="green" />
              </p>
              <pre className="about-stack">{stack}</pre>
              <p className="muted small">
                seus dados são só seus: cada conta enxerga apenas as próprias linhas (row level security).
              </p>
            </>
          ) : (
            <>
              <p className="muted small">app de finanças pessoais, 100% gratuito — controle seus gastos sem complicação.</p>
              <ul className="insights">
                {feats.map(([ico, txt]) => (
                  <li key={txt} className="insight">
                    <Icon name={ico} className="ins-ico" />
                    <span>{txt}</span>
                  </li>
                ))}
              </ul>
              <p className="muted small">
                seus dados são protegidos: cada conta enxerga apenas os próprios dados (row level security).
              </p>
              <p className="small">
                desenvolvido por <b className="green">ana</b> <Icon name="heart" className="green" />
              </p>
            </>
          )}
        </div>

        <div className="modal-foot">
          <span className="muted small">feito com <Icon name="coffee" /> + código</span>
          <div>
            <button type="button" className="link" onClick={onClose}>
              fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
