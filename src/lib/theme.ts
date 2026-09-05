export type ThemePref = 'system' | 'light' | 'dark'

const KEY = 'fin-theme'
let currentPref: ThemePref = 'system'

function prefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolved(pref: ThemePref): 'light' | 'dark' {
  return pref === 'system' ? (prefersDark() ? 'dark' : 'light') : pref
}

export function getStoredTheme(): ThemePref {
  const v = localStorage.getItem(KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

// a cor da barra do sistema (PWA/mobile) acompanha o tema resolvido
const THEME_COLOR: Record<'light' | 'dark', string> = { dark: '#141414', light: '#f4f4f3' }
function paint(mode: 'light' | 'dark') {
  document.documentElement.dataset.theme = mode
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[mode])
}

// só muda a aparência na tela (sem gravar) — usado p/ preview no painel de configs
export function previewTheme(pref: ThemePref) {
  currentPref = pref
  paint(resolved(pref))
}

// muda a aparência E grava a preferência (no boot e ao salvar)
export function applyTheme(pref: ThemePref) {
  previewTheme(pref)
  try {
    localStorage.setItem(KEY, pref)
  } catch {
    /* localStorage indisponivel (modo privado etc) - ignora */
  }
}

// chamada uma vez no boot (main.tsx): aplica o tema salvo e segue o SO quando 'system'
export function initTheme() {
  currentPref = getStoredTheme()
  paint(resolved(currentPref))
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (currentPref === 'system') paint(resolved('system'))
  }
  if (mq.addEventListener) mq.addEventListener('change', onChange)
  else mq.addListener(onChange)
}
