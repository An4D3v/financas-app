import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { Category } from '../../types'
import type { NewTx } from '../../hooks/useFinanceData'
import { scanReceipt, type ScanResult } from '../../lib/scan'
import { todayStr } from '../../lib/format'

type Props = {
  cats: Category[]
  onAdd: (tx: NewTx) => Promise<string | null>
  onScanned: (result: ScanResult) => void
}

/** card "novo lançamento": botão de escanear nota + formulário manual */
export function EntryForm({ cats, onAdd, onScanned }: Props) {
  const [date, setDate] = useState(todayStr())
  const [type, setType] = useState<'entrada' | 'saida'>('saida')
  const [desc, setDesc] = useState('')
  const [catId, setCatId] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const valor = Number(amount.replace(',', '.'))
    if (!desc.trim() || !valor || valor <= 0) return
    setSaving(true)
    const err = await onAdd({ occurred_on: date, type, description: desc.trim(), amount: valor, category_id: catId || null })
    setSaving(false)
    if (err) {
      alert(err)
      return
    }
    setDesc('')
    setAmount('')
  }

  async function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setScanning(true)
    setScanMsg(null)
    try {
      const result = await scanReceipt(file, cats)
      if (!result.rows.length) {
        setScanMsg('não consegui ler valores nessa foto. tenta uma mais nítida e reta, ou preenche manual.')
        return
      }
      onScanned(result)
    } catch (err) {
      setScanMsg('erro ao escanear: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setScanning(false)
    }
  }

  return (
    <section className="card">
      <h2 className="ttl">&gt;_ novo lançamento</h2>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={onPickPhoto}
      />
      <button type="button" className="btn scan" onClick={() => fileRef.current?.click()} disabled={scanning}>
        {scanning ? 'lendo a nota...' : '📷 escanear nota'}
      </button>
      {scanMsg && <p className="msg">{scanMsg}</p>}
      <form className="form" onSubmit={submit}>
        <div className="row">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select value={type} onChange={(e) => setType(e.target.value as 'entrada' | 'saida')}>
            <option value="saida">saída</option>
            <option value="entrada">entrada</option>
          </select>
        </div>
        <input placeholder="descrição" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <div className="row">
          <select value={catId} onChange={(e) => setCatId(e.target.value)}>
            <option value="">categoria...</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input inputMode="decimal" placeholder="valor R$" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <button className="btn primary" disabled={saving}>
          {saving ? '...' : 'adicionar'}
        </button>
      </form>
    </section>
  )
}
