import { useState } from 'react'
import { brDateTime } from '../lib/format'
import { Icon } from './Icon'
import type { Note } from '../types'

function NoteCard({
  note,
  onUpdate,
  onDelete,
}: {
  note: Note
  onUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
}) {
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState(note.content)

  const edited = note.updated_at !== note.created_at
  const stamp = (edited ? 'editada em ' : 'criada em ') + brDateTime(edited ? note.updated_at : note.created_at)

  function save() {
    const v = draft.trim()
    if (v && v !== note.content) onUpdate(note.id, v)
    setEdit(false)
  }

  return (
    <li className="note-card">
      {edit ? (
        <>
          <textarea
            className="note-input"
            autoFocus
            rows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="note-foot">
            <span className="muted small">{stamp}</span>
            <div className="note-btns">
              <button
                type="button"
                className="link"
                onClick={() => {
                  setDraft(note.content)
                  setEdit(false)
                }}
              >
                cancelar
              </button>
              <button type="button" className="btn primary note-save" onClick={save} disabled={!draft.trim()}>
                <Icon name="save" /> salvar
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="note-text" title="clique p/ editar" onClick={() => setEdit(true)}>
            {note.content}
          </div>
          <div className="note-foot">
            <span className="muted small">{stamp}</span>
            <div className="note-btns">
              <button type="button" className="icon-btn note-edit" onClick={() => setEdit(true)} title="editar" aria-label="editar">
                <Icon name="edit" />
              </button>
              <button className="x" onClick={() => onDelete(note.id)} title="excluir">
                ×
              </button>
            </div>
          </div>
        </>
      )}
    </li>
  )
}

export function NotesModal({
  notes,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: {
  notes: Note[]
  onAdd: (content: string) => Promise<string | null>
  onUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  async function add() {
    const v = draft.trim()
    if (!v) return
    setSaving(true)
    const err = await onAdd(v)
    setSaving(false)
    if (err) {
      alert(err)
      return
    }
    setDraft('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="ttl">&gt;_ anotações</h2>
          <button className="x" onClick={onClose} title="fechar">
            ×
          </button>
        </div>
        <p className="muted small">escreva o que quiser (compras do mês, pretensões...). fica salvo com data e hora.</p>

        <div className="set-section">
          <span className="set-label">// nova anotação</span>
          <textarea
            className="note-input"
            rows={3}
            placeholder="escreva aqui..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn primary" disabled={saving || !draft.trim()} onClick={add}>
            {saving ? (
              '...'
            ) : (
              <>
                <Icon name="save" /> salvar
              </>
            )}
          </button>
        </div>

        {notes.length > 0 && (
          <ul className="notes-list review-rows">
            {notes.map((n) => (
              <NoteCard key={n.id} note={n} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
