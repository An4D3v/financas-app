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

export function applyTheme(pref: ThemePref) {
  currentPref = pref
  document.documentElement.dataset.theme = resolved(pref)
  try {
    localStorage.setItem(KEY, pref)
  } catch {
    /* localStorage indisponivel (modo privado etc) - ignora */
  }
}

// chamada uma vez no boot (main.tsx): aplica o tema salvo e segue o SO quando 'system'
export function initTheme() {
  currentPref = getStoredTheme()
  document.documentElement.dataset.theme = resolved(currentPref)
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (currentPref === 'system') document.documentElement.dataset.theme = resolved('system')
  }
  if (mq.addEventListener) mq.addEventListener('change', onChange)
  else mq.addListener(onChange)
}
