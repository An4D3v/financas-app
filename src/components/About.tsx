export function About({ isOwner, onClose }: { isOwner: boolean; onClose: () => void }) {
  const stack = [
    'react + typescript + vite',
    'supabase  (auth · postgres · RLS)',
    'gemini    (leitura das notas)',
    'recharts  (graficos)',
  ].join('\n')

  const feats: [string, string][] = [
    ['📷', 'escaneie a nota fiscal e lance no automático (IA)'],
    ['🏷️', 'categorias, filtros por período e calendário'],
    ['📊', 'resumo com insights dos seus gastos'],
    ['🌗', 'tema claro / escuro'],
    ['⬇️', 'exporte tudo em CSV quando quiser'],
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
              <p className="muted small">seu dashboard de grana — 100% gratuito, feito por você 💚</p>
              <pre className="about-stack">{stack}</pre>
              <p className="muted small">
                seus dados sao so seus: cada conta enxerga apenas as proprias linhas (Row Level Security).
              </p>
            </>
          ) : (
            <>
              <p className="muted small">app de finanças pessoais, 100% gratuito — controle seus gastos sem complicação.</p>
              <ul className="insights">
                {feats.map(([ico, txt]) => (
                  <li key={txt} className="insight">
                    <span className="ins-ico">{ico}</span>
                    <span>{txt}</span>
                  </li>
                ))}
              </ul>
              <p className="muted small">
                seus dados sao protegidos: cada conta enxerga apenas os proprios dados (Row Level Security).
              </p>
              <p className="small">
                desenvolvido por <b className="green">Ana</b> 💚
              </p>
            </>
          )}
        </div>

        <div className="modal-foot">
          <span className="muted small">feito com ☕ + código</span>
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
