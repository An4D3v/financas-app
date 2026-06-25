import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { data, error } =
      mode === 'in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { username: username.trim() } } })
    if (error) setMsg(error.message)
    // se veio sessao, o onAuthStateChange ja loga sozinho; senao, precisa confirmar e-mail
    else if (mode === 'up' && !data.session)
      setMsg('quase lá! te enviamos um e-mail de confirmação — confirma e faz o login.')
    setBusy(false)
  }

  return (
    <div className="center">
      <form className="card auth" onSubmit={submit}>
        <h1 className="brand">alien@finanças<span className="accent">:~$</span></h1>
        <p className="muted small">{mode === 'in' ? 'entrar na sua conta' : 'criar conta'}</p>
        {mode === 'up' && (
          <input
            placeholder="nome de usuário (ex: alien)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            maxLength={14}
          />
        )}
        <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          type="password"
          placeholder="senha (min. 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button className="btn primary" disabled={busy}>
          {busy ? '...' : mode === 'in' ? 'entrar' : 'cadastrar'}
        </button>
        {msg && <p className="msg">{msg}</p>}
        <button type="button" className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(null) }}>
          {mode === 'in' ? 'não tem conta? cadastre-se' : 'já tem conta? entrar'}
        </button>
      </form>
    </div>
  )
}
