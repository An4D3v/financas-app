export function About({ onClose }: { onClose: () => void }) {
  const stack = [
    'react + typescript + vite',
    'supabase  (auth · postgres · RLS)',
    'gemini    (leitura das notas)',
    'recharts  (graficos)',
  ].join('\n')

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
          <p className="muted small">seu dashboard de grana — 100% gratuito, feito por você 💚</p>
          <pre className="about-stack">{stack}</pre>
          <p className="muted small">
            seus dados sao so seus: cada conta enxerga apenas as proprias linhas (Row Level Security).
          </p>
        </div>

        <div className="modal-foot">
          <span className="muted small">made with ☕ + código</span>
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
