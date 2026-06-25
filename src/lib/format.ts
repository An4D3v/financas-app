// helpers puros de formatação e datas (sem dependência de React)

/** formata número como moeda BRL: 1234.5 -> "R$ 1.234,50" */
export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** data de hoje em ISO curto (YYYY-MM-DD) */
export const todayStr = () => new Date().toISOString().slice(0, 10)

/** data de N dias atrás (YYYY-MM-DD) */
export function daysAgoStr(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/** desloca uma data (YYYY-MM-DD) em N dias (N negativo = passado) */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/** "2026-06-24" -> "24/06" */
export const brDate = (d: string) => (d ? d.slice(8, 10) + '/' + d.slice(5, 7) : '')

/** lê um arquivo como base64 puro (sem o prefixo data:...) */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** normaliza o nome de usuário p/ o dash: minúsculo + só a primeira palavra ("Little-Jeff" -> "little") */
export function toHandle(raw: string | null | undefined): string {
  const first = (raw ?? '')
    .toLowerCase()
    .trim()
    .split(/[\s\-_.@]+/)
    .filter(Boolean)[0]
  return first || 'user'
}
