import { useRef, useState } from 'react'
import type { Profile } from '../../types'
import { useDismissable } from '../../hooks/useDismissable'
import { Icon } from '../Icon'

type Props = {
  handle: string
  profile: Profile | null
  showCaret: boolean
  canReorder: boolean
  onSettings: () => void
  onCustomize: () => void
  onBudget: () => void
  onRecurring: () => void
  onAccount: () => void
  onExport: () => void
  onAbout: () => void
  onSignOut: () => void
}

/** cabeçalho: marca, bio do perfil e o menu (≡) com as ações do app */
export function TopBar({ handle, profile, showCaret, canReorder, onSettings, onCustomize, onBudget, onRecurring, onAccount, onExport, onAbout, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismissable(open, ref, () => setOpen(false))

  const pick = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }

  return (
    <header className="topbar">
      <div className="brand-wrap">
        <h1 className="brand">
          {handle}@finanças<span className="accent">:~$</span> <span className="dim">dashboard</span>
          {showCaret && <span className="caret" aria-hidden="true" />}
        </h1>
        {(profile?.profession || (profile?.hobbies?.length ?? 0) > 0) && (
          <p className="bio">
            {profile?.profession && <span className="bio-prof">// {profile.profession}</span>}
            {profile?.hobbies?.map((h) => (
              <span key={h} className="bio-tag">
                #{h}
              </span>
            ))}
          </p>
        )}
      </div>
      <div className="menu-wrap" ref={ref}>
        <button
          className="icon-btn menu-btn"
          title="menu"
          aria-label="menu"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          ≡
        </button>
        {open && (
          <div className="menu" role="menu">
            <button className="menu-item" role="menuitem" onClick={pick(onSettings)}>
              <Icon name="settings" className="menu-ico" /> configurações
            </button>
            {canReorder && (
              <button className="menu-item" role="menuitem" onClick={pick(onCustomize)}>
                <Icon name="layout" className="menu-ico" /> customização
              </button>
            )}
            <button className="menu-item" role="menuitem" onClick={pick(onBudget)}>
              <Icon name="wallet" className="menu-ico" /> metas
            </button>
            <button className="menu-item" role="menuitem" onClick={pick(onRecurring)}>
              <Icon name="repeat" className="menu-ico" /> contas fixas
            </button>
            <button className="menu-item" role="menuitem" onClick={pick(onAccount)}>
              <Icon name="user" className="menu-ico" /> minha conta
            </button>
            <button className="menu-item" role="menuitem" onClick={pick(onExport)}>
              <Icon name="download" className="menu-ico" /> exportar dados
            </button>
            <button className="menu-item" role="menuitem" onClick={pick(onAbout)}>
              <Icon name="info" className="menu-ico" /> sobre
            </button>
            <button className="menu-item danger" role="menuitem" onClick={pick(onSignOut)}>
              <Icon name="logout" className="menu-ico" /> sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
