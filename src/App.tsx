import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { Login } from './components/Login'
import { Dashboard } from './components/dashboard/Dashboard'
import { TOUR_VISTO_KEY } from './lib/constants'

/**
 * Primeira visita (sem sessão e sem flag) → apresenta o tour antes do login.
 * Se o localStorage não estiver gravável, o tour nunca conseguiria marcar a
 * flag e o redirect viraria loop — nesse caso, vai direto pro login.
 */
function deveVerTour(): boolean {
  // callbacks de auth do Supabase chegam no hash (#access_token=…/#error=…) —
  // redirecionar pro tour aqui descartaria o retorno (ou o erro) do link de e-mail
  if (window.location.hash) return false
  try {
    if (localStorage.getItem(TOUR_VISTO_KEY)) return false
    localStorage.setItem('__af_probe', '1')
    localStorage.removeItem('__af_probe')
    return true
  } catch {
    return false
  }
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // quem já tem conta não deve cair no tour ao sair da sessão
    if (session) {
      try {
        localStorage.setItem(TOUR_VISTO_KEY, '1')
      } catch {
        /* sem storage, sem flag */
      }
    }
  }, [session])

  const mostrarTour = !loading && !session && deveVerTour()
  useEffect(() => {
    if (mostrarTour) window.location.replace('/tour.html?app=1')
  }, [mostrarTour])

  if (loading || mostrarTour) return <div className="center muted">carregando...</div>
  return session ? <Dashboard session={session} /> : <Login />
}
