// preferências de layout do dashboard (por dispositivo, no localStorage):
// a ordem das seções + ligar/desligar o cursor piscando da marca.

export type BlockKey = 'kpis' | 'entry' | 'chart' | 'budget' | 'summary' | 'txs'

export const BLOCK_LABELS: Record<BlockKey, string> = {
  kpis: 'valores (renda/gastos/saldo)',
  entry: 'novo lançamento',
  chart: 'gastos por categoria',
  budget: 'orçamento (metas)',
  summary: 'resumo',
  txs: 'lançamentos',
}

export const DEFAULT_ORDER: BlockKey[] = ['kpis', 'entry', 'chart', 'budget', 'summary', 'txs']

const ORDER_KEY = 'fin-order'
const CARET_KEY = 'fin-caret'
const QUICK_KEY = 'fin-quick'

/** lê a ordem salva mantendo a preferência do usuário e anexando blocos novos no fim */
export function loadOrder(): BlockKey[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) {
        const valid = [...new Set(arr.filter((k: unknown): k is BlockKey => DEFAULT_ORDER.includes(k as BlockKey)))]
        const missing = DEFAULT_ORDER.filter((k) => !valid.includes(k))
        const merged = [...valid, ...missing]
        if (merged.length === DEFAULT_ORDER.length) return merged
      }
    }
  } catch {
    /* ignora */
  }
  return [...DEFAULT_ORDER]
}

export function saveOrder(order: BlockKey[]) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order))
  } catch {
    /* ignora */
  }
}

/** cursor piscando ligado por padrão; só o valor 'off' desliga */
export function loadCaret(): boolean {
  try {
    return localStorage.getItem(CARET_KEY) !== 'off'
  } catch {
    return true
  }
}

export function saveCaret(on: boolean) {
  try {
    localStorage.setItem(CARET_KEY, on ? 'on' : 'off')
  } catch {
    /* ignora */
  }
}

/** acento do painel (cockpit): ciano por padrão; azul e verde como opção — vira data-accent no <html> */
export type Accent = 'ciano' | 'azul' | 'verde'
export const ACCENTS: { id: Accent; label: string }[] = [
  { id: 'ciano', label: 'ciano' },
  { id: 'azul', label: 'azul' },
  { id: 'verde', label: 'verde' },
]
const ACCENT_KEY = 'fin-accent'

export function loadAccent(): Accent {
  try {
    const v = localStorage.getItem(ACCENT_KEY)
    return v === 'azul' || v === 'verde' ? v : 'ciano'
  } catch {
    return 'ciano'
  }
}

/** só muda a aparência (preview nos painéis); não grava */
export function applyAccent(a: Accent) {
  document.documentElement.dataset.accent = a
}

export function saveAccent(a: Accent) {
  applyAccent(a)
  try {
    localStorage.setItem(ACCENT_KEY, a)
  } catch {
    /* ignora */
  }
}

/** atalhos flutuantes (botão + com notas/calculadora) ligados por padrão; só o valor 'off' desliga */
export function loadQuickActions(): boolean {
  try {
    return localStorage.getItem(QUICK_KEY) !== 'off'
  } catch {
    return true
  }
}

export function saveQuickActions(on: boolean) {
  try {
    localStorage.setItem(QUICK_KEY, on ? 'on' : 'off')
  } catch {
    /* ignora */
  }
}
