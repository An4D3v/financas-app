import { useState, type KeyboardEvent } from 'react'
import type { ThemePref } from '../lib/theme'

const MAX_HOBBIES = 10

const THEMES: { id: ThemePref; label: string; icon: string }[] = [
  { id: 'system', label: 'sistema', icon: '🖥️' },
  { id: 'light', label: 'claro', icon: '☀️' },
  { id: 'dark', label: 'escuro', icon: '🌙' },
]

export function Settings({
  email,
  profession: initProfession,
  hobbies: initHobbies,
  theme,
  onTheme,
  onClose,
  onSave,
}: {
  email: string
  profession: string
  hobbies: string[]
  theme: ThemePref
  onTheme: (t: ThemePref) => void
  onClose: () => void
  onSave: (data: { profession: string; hobbies: string[]; theme: ThemePref }) => Promise<void>
}) {
  const [profession, setProfession] = useState(initProfession)
  const [hobbies, setHobbies] = useState<string[]>(initHobbies)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const full = hobbies.length >= MAX_HOBBIES

  function addHobby() {
    const v = draft.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase()
    if (!v || full) return
    if (!hobbies.includes(v)) setHobbies([...hobbies, v])
    setDraft('')
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addHobby()
    } else if (e.key === 'Backspace' && !draft && hobbies.length) {
      setHobbies(hobbies.slice(0, -1))
    }
  }
  async function save() {
    setSaving(true)
    await onSave({ profession: profession.trim(), hobbies, theme })
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="ttl">&gt;_ configurações</h2>
          <button className="x" onClick={onClose} title="fechar">
            ×
          </button>
        </div>
        <p className="muted small">logado como {email}</p>

        <div className="set-section">
          <span className="set-label">// aparência</span>
          <div className="chips">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={'chip' + (theme === t.id ? ' active' : '')}
                onClick={() => onTheme(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="set-section">
          <span className="set-label">// profissão</span>
          <input
            placeholder="ex: desenvolvedora .net"
            value={profession}
            maxLength={60}
            onChange={(e) => setProfession(e.target.value)}
          />
        </div>

        <div className="set-section">
          <span className="set-label">
            // hobbies favoritos <span className="muted">({hobbies.length}/{MAX_HOBBIES})</span>
          </span>
          {hobbies.length > 0 && (
            <div className="tags">
              {hobbies.map((h) => (
                <span key={h} className="tag">
                  #{h}
                  <button type="button" className="tag-x" onClick={() => setHobbies(hobbies.filter((x) => x !== h))} title="remover">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            placeholder={full ? 'limite de 10 atingido' : 'digite e tecle enter (ex: violão)'}
            value={draft}
            disabled={full}
            maxLength={24}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
          />
        </div>

        <div className="modal-foot">
          <span className="muted small">tema aplica na hora · perfil salva ao confirmar</span>
          <div>
            <button type="button" className="link" onClick={onClose}>
              cancelar
            </button>
            <button className="btn primary" disabled={saving} onClick={save}>
              {saving ? '...' : 'salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
