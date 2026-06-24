import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Account({
  email,
  handle,
  createdAt,
  txCount,
  onClose,
}: {
  email: string
  handle: string
  createdAt: string
  txCount: number
  onClose: () => void
}) {
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const created = createdAt ? new Date(createdAt).toLocaleDateString('pt-BR') : '—'

  async function changePw() {
    if (pw.length < 6) {
      setMsg('A senha precisa ter no minimo 6 caracteres.')
      return
    }
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) {
      setMsg('erro: ' + error.message)
      return
    }
    setMsg('senha atualizada! 🔒')
    setPw('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="ttl">&gt;_ minha conta</h2>
          <button className="x" onClick={onClose} title="fechar">
            ×
          </button>
        </div>

        <div className="kv">
          <div className="kv-row">
            <span className="kv-k">usuario</span>
            <span className="kv-v">{handle}</span>
          </div>
          <div className="kv-row">
            <span className="kv-k">email</span>
            <span className="kv-v">{email}</span>
          </div>
          <div className="kv-row">
            <span className="kv-k">conta criada</span>
            <span className="kv-v">{created}</span>
          </div>
          <div className="kv-row">
            <span className="kv-k">lancamentos</span>
            <span className="kv-v">{txCount}</span>
          </div>
        </div>

        <div className="set-section">
          <span className="set-label">// trocar senha</span>
          <div className="row">
            <input
              type="password"
              placeholder="nova senha (min. 6)"
              value={pw}
              minLength={6}
              onChange={(e) => setPw(e.target.value)}
            />
            <button className="btn primary" style={{ flex: 'none' }} disabled={busy || !pw} onClick={changePw}>
              {busy ? '...' : 'atualizar'}
            </button>
          </div>
          {msg && <p className="msg">{msg}</p>}
        </div>

        <div className="modal-foot">
          <span className="muted small">protegido por rls — so você acessa</span>
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
