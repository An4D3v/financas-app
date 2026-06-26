import { useState, type KeyboardEvent } from 'react'
import type { ThemePref } from '../lib/theme'
import { Icon, type IconName } from './Icon'

const MAX_HOBBIES = 4

const THEMES: { id: ThemePref; label: string; icon: IconName }[] = [
  { id: 'system', label: 'sistema', icon: 'monitor' },
  { id: 'light', label: 'claro', icon: 'sun' },
  { id: 'dark', label: 'escuro', icon: 'moon' },
]

export function Settings({
  email,
  profession: initProfession,
  hobbies: initHobbies,
  theme,
  onPreview,
  onClose,
  onSave,
}: {
  email: string
  profession: string
  hobbies: string[]
  theme: ThemePref
  onPreview: (t: ThemePref) => void
  onClose: () => void
  onSave: (data: { profession: string; hobbies: string[]; theme: ThemePref }) => Promise<void>
}) {
  const [profession, setProfession] = useState(initProfession)
  const [hobbies, setHobbies] = useState<string[]>(initHobbies)
  const [themeDraft, setThemeDraft] = useState(theme)
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
    await onSave({ profession: profession.trim(), hobbies, theme: themeDraft })
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
                className={'chip' + (themeDraft === t.id ? ' active' : '')}
                onClick={() => {
                  setThemeDraft(t.id)
                  onPreview(t.id)
                }}
              >
                <Icon name={t.icon} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="set-section">
          <span className="set-label">// profissão</span>
          <input
            placeholder="ex: desenvolvedora .net"
            value={profession}
            maxLength={40}
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
            placeholder={full ? `limite de ${MAX_HOBBIES} atingido` : 'digite e tecle enter (ex: violão)'}
            value={draft}
            disabled={full}
            maxLength={16}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
          />
        </div>

        <div className="modal-foot">
          <span className="muted small">preview na hora; sem salvar, volta ao anterior</span>
          <div>
            <button type="button" className="icon-btn" onClick={onClose} title="cancelar" aria-label="cancelar">
              <Icon name="x" />
            </button>
            <button className="btn primary" disabled={saving} onClick={save} title="salvar" aria-label="salvar">
              {saving ? '...' : <Icon name="save" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
