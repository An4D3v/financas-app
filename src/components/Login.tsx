import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { error } =
      mode === 'in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    if (error) setMsg(error.message)
    else if (mode === 'up')
      setMsg('Conta criada. Se pedir confirmacao de email, crie o usuario pelo painel (Auto Confirm) e entre.')
    setBusy(false)
  }

  return (
    <div className="center">
      <form className="card auth" onSubmit={submit}>
        <h1 className="brand">ana@financas<span className="accent">:~$</span></h1>
        <p className="muted small">{mode === 'in' ? 'entrar na sua conta' : 'criar conta'}</p>
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
          {busy ? '...' : mode === 'in' ? 'Entrar' : 'Cadastrar'}
        </button>
        {msg && <p className="msg">{msg}</p>}
        <button type="button" className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(null) }}>
          {mode === 'in' ? 'Nao tem conta? Cadastre-se' : 'Ja tem conta? Entrar'}
        </button>
      </form>
    </div>
  )
}
