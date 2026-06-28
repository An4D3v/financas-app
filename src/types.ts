export type Category = {
  id: string
  name: string
  kind: 'entrada' | 'saida' | 'ambos'
  color: string | null
}

export type Profile = {
  user_id: string
  profession: string | null
  hobbies: string[]
  theme: 'system' | 'light' | 'dark'
  updated_at?: string
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

/** meta (orçamento) mensal de uma categoria */
export type Budget = {
  id: string
  category_id: string
  amount: number
  categories?: { name: string; color: string | null } | null
}

/** uma linha do modal de revisão da nota escaneada */
export type ReviewRow = { description: string; value: string; categoryId: string; type: 'entrada' | 'saida' }

/** campos editáveis de uma transação (edição inline na lista) */
export type TxPatch = Partial<Pick<Transaction, 'description' | 'category_id' | 'amount' | 'occurred_on' | 'type'>>
