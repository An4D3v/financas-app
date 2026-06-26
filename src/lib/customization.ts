// preferências de layout do dashboard (por dispositivo, no localStorage):
// a ordem das seções + ligar/desligar o cursor piscando da marca.

export type BlockKey = 'kpis' | 'entry' | 'chart' | 'summary' | 'txs'

export const BLOCK_LABELS: Record<BlockKey, string> = {
  kpis: 'valores (renda/gastos/saldo)',
  entry: 'novo lançamento',
  chart: 'gastos por categoria',
  summary: 'resumo',
  txs: 'lançamentos',
}

export const DEFAULT_ORDER: BlockKey[] = ['kpis', 'entry', 'chart', 'summary', 'txs']

const ORDER_KEY = 'fin-order'
const CARET_KEY = 'fin-caret'

/** lê a ordem salva, só aceitando uma permutação exata das seções conhecidas */
export function loadOrder(): BlockKey[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY)
    if (!raw) return [...DEFAULT_ORDER]
    const arr = JSON.parse(raw)
    if (Array.isArray(arr) && arr.length === DEFAULT_ORDER.length && DEFAULT_ORDER.every((k) => arr.includes(k))) {
      return arr as BlockKey[]
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
