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
  return localStorage.getItem(CARET_KEY) !== 'off'
}

export function saveCaret(on: boolean) {
  try {
    localStorage.setItem(CARET_KEY, on ? 'on' : 'off')
  } catch {
    /* ignora */
  }
}
