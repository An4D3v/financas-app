import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './lib/theme'
import { applyAccent, loadAccent } from './lib/customization'
import { registerSW } from 'virtual:pwa-register'

initTheme()
applyAccent(loadAccent()) // acento escolhido em customização (ciano/azul/verde), antes da 1ª pintura
registerSW({ immediate: true }) // instala/atualiza o app instalável (PWA)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
