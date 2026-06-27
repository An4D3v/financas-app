import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './lib/theme'
import { registerSW } from 'virtual:pwa-register'

initTheme()
registerSW({ immediate: true }) // instala/atualiza o app instalável (PWA)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
