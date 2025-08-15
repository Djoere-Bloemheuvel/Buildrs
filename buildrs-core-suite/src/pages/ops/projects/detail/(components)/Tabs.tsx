'use client'

import { useNavigate, useSearchParams } from 'react-router-dom'

const tabs = [
  { k: 'overview', label: 'Overzicht' },
  { k: 'board', label: 'Bord' },
  { k: 'tasks', label: 'Taken' },
  { k: 'calendar', label: 'Kalender' },
]

export function Tabs() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const active = params.get('tab') ?? 'overview'
  function go(k: string) {
    const sp = new URLSearchParams(params.toString()); sp.set('tab', k); nav({ search: `?${sp.toString()}` })
  }
  return (
    <div className="flex items-center gap-2">
      {tabs.map(t => (
        <button key={t.k} onClick={() => go(t.k)} className={`rounded-md px-3 py-1.5 text-sm ${active===t.k?'bg-primary/10 text-primary':'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{t.label}</button>
      ))}
    </div>
  )
}

