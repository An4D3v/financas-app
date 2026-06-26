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

  function switchTo(m: 'in' | 'up') {
    setMode(m)
    setMsg(null)
  }

  return (
    <div className="login-scene">
      <div className="login-glow" aria-hidden="true" />
      <div className="login-grid" aria-hidden="true" />

      <form className="term" onSubmit={submit}>
        <div className="term-bar">
          <span className="tdot r" />
          <span className="tdot y" />
          <span className="tdot g" />
          <span className="term-name">alien-finanças — bash</span>
        </div>

        <div className="term-body">
          <h1 className="brand brand-lg">
            alien@finanças<span className="accent">:~$</span>
            <span className="caret" aria-hidden="true" />
          </h1>
          <p className="term-line" key={mode}>
            <span className="prompt">$</span> {mode === 'in' ? 'login --user' : 'signup --novo'}
          </p>

          <div className="auth-tabs" role="tablist">
            <span className={'auth-ind' + (mode === 'up' ? ' up' : '')} aria-hidden="true" />
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'in'}
              className={'auth-tab' + (mode === 'in' ? ' on' : '')}
              onClick={() => switchTo('in')}
            >
              entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'up'}
              className={'auth-tab' + (mode === 'up' ? ' on' : '')}
              onClick={() => switchTo('up')}
            >
              cadastrar
            </button>
          </div>

          <div className={'field-collapse' + (mode === 'up' ? ' open' : '')}>
            <label className="field">
              <span className="field-pre">user</span>
              <input
                aria-label="nome de usuário"
                placeholder="nome de usuário (ex: alien)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={mode === 'up'}
                disabled={mode === 'in'}
                maxLength={14}
              />
            </label>
          </div>
          <label className="field">
            <span className="field-pre">mail</span>
            <input
              aria-label="email"
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span className="field-pre">pass</span>
            <input
              aria-label="senha"
              type="password"
              placeholder="senha (min. 6)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          <button className="btn primary login-go" disabled={busy}>
            {busy ? (
              '...'
            ) : (
              <span className="swap" key={mode}>
                {mode === 'in' ? 'entrar' : 'cadastrar'}
              </span>
            )}
          </button>
          {msg && <p className="msg">{msg}</p>}

          <p className="term-foot muted small">// suas finanças, 100% no seu terminal</p>
        </div>
      </form>
    </div>
  )
}
