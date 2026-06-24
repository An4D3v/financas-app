export type Category = {
  id: string
  name: string
  kind: 'entrada' | 'saida' | 'ambos'
  color: string | null
}

export type Transaction = {
  id: string
  occurred_on: string // YYYY-MM-DD
  type: 'entrada' | 'saida'
  description: string
  amount: number
  category_id: string | null
  categories?: { name: string; color: string | null } | null
  created_at: string
}
