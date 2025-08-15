'use client'

// Eenvoudige keyboard shortcut-registratie voor Inbox
// j/k: navigeren, Enter: open, a/r/s: acties (accept/retry/snooze), Esc: sluit drawer

export type ShortcutHandlers = {
  onNext: () => void
  onPrev: () => void
  onOpen: () => void
  onAccept: () => void
  onRetry: () => void
  onSnooze: () => void
  onCloseDrawer: () => void
  isTypingInInput?: () => boolean
}

export function registerInboxShortcuts(handlers: ShortcutHandlers) {
  const onKey = (e: KeyboardEvent) => {
    const typing = handlers.isTypingInInput?.() ?? false
    // Slash handled by Toolbar; respect inputs
    if (typing) return
    if (e.key === 'j') { e.preventDefault(); handlers.onNext(); return }
    if (e.key === 'k') { e.preventDefault(); handlers.onPrev(); return }
    if (e.key === 'Enter') { e.preventDefault(); handlers.onOpen(); return }
    if (e.key === 'a') { e.preventDefault(); handlers.onAccept(); return }
    if (e.key === 'r') { e.preventDefault(); handlers.onRetry(); return }
    if (e.key === 's') { e.preventDefault(); handlers.onSnooze(); return }
    if (e.key === 'Escape') { handlers.onCloseDrawer(); return }
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}

