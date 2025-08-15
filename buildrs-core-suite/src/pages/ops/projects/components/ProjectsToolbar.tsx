'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const DENSITY_KEY = 'ops_projects_density_v1'
const VIEWS_KEY = 'ops_projects_saved_views_v1'
const COLS_KEY = 'ops_projects_columns_v1'

export function useDensity() {
  const [density, setDensity] = useState<'compact' | 'roomy'>(() => (localStorage.getItem(DENSITY_KEY) as any) || 'roomy')
  useEffect(() => { localStorage.setItem(DENSITY_KEY, density) }, [density])
  return { density, setDensity }
}

export type ColumnKey = 'owner' | 'openTasks' | 'overdueTasks' | 'dueDate' | 'health'

export function useColumnVisibility() {
  const [visible, setVisible] = useState<Record<ColumnKey, boolean>>(() => {
    const raw = localStorage.getItem(COLS_KEY)
    return raw ? JSON.parse(raw) : { owner: true, openTasks: true, overdueTasks: true, dueDate: true, health: true }
  })
  useEffect(() => { localStorage.setItem(COLS_KEY, JSON.stringify(visible)) }, [visible])
  return { visible, setVisible }
}

export function ProjectsToolbar() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [localQ, setLocalQ] = useState(params.get('q') ?? '')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { density, setDensity } = useDensity()
  const { visible, setVisible } = useColumnVisibility()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === '/') { e.preventDefault(); searchInputRef.current?.focus() } }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])

  const status = params.get('status') ?? 'all'
  const health = params.get('health') ?? 'all'
  const ownerId = params.get('ownerId') ?? 'all'
  const due = params.get('due') ?? 'all'
  const sort = params.get('sort') ?? 'updated'
  const pageSize = params.get('pageSize') ?? '25'
  const group = params.get('group') ?? 'none'

  function update(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams(params.toString())
    Object.entries(next).forEach(([k, v]) => { if (!v) sp.delete(k); else sp.set(k, v) })
    sp.set('page', '1')
    nav({ pathname: '/ops/projects', search: `?${sp.toString()}` })
  }

  // Saved views
  type SavedView = {
    name: string
    params: Record<string, string>
    columns: Record<ColumnKey, boolean>
    density: 'compact'|'roomy'
  }
  const [views, setViews] = useState<SavedView[]>(() => {
    const raw = localStorage.getItem(VIEWS_KEY)
    return raw ? JSON.parse(raw) : []
  })
  const [saveMode, setSaveMode] = useState(false)
  const [viewName, setViewName] = useState('Nieuwe weergave')

  function applyView(v: SavedView) {
    update(v.params)
    localStorage.setItem(DENSITY_KEY, v.density)
    localStorage.setItem(COLS_KEY, JSON.stringify(v.columns))
    window.location.reload()
  }

  function saveCurrentView() {
    const cur: SavedView = {
      name: viewName.trim() || 'Weergave',
      params: Object.fromEntries(new URLSearchParams(params.toString()).entries()),
      columns: visible,
      density,
    }
    const next = [...views.filter(x => x.name !== cur.name), cur]
    localStorage.setItem(VIEWS_KEY, JSON.stringify(next))
    setViews(next)
    setSaveMode(false)
  }

  function deleteView(name: string) {
    const next = views.filter(v => v.name !== name)
    localStorage.setItem(VIEWS_KEY, JSON.stringify(next))
    setViews(next)
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 p-4 sticky top-0 z-10 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          ref={searchInputRef}
          className="h-9 w-72"
          placeholder="Projecten zoeken…"
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') update({ q: localQ || undefined }) }}
          aria-label="Projecten zoeken"
        />

        <Select value={status} onValueChange={(v) => update({ status: v })}>
          <SelectTrigger className="h-9 w-[140px]" aria-label="Status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {['all','active','on_hold','completed','archived'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={health} onValueChange={(v) => update({ health: v })}>
          <SelectTrigger className="h-9 w-[140px]" aria-label="Gezondheid">
            <SelectValue placeholder="Gezondheid" />
          </SelectTrigger>
          <SelectContent>
            {['all','excellent','good','warn','risk'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={ownerId} onValueChange={(v) => update({ ownerId: v })}>
          <SelectTrigger className="h-9 w-[160px]" aria-label="Eigenaar">
            <SelectValue placeholder="Eigenaar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="u1">Eva Janssen</SelectItem>
            <SelectItem value="u2">Thijs Bakker</SelectItem>
            <SelectItem value="u3">Mila Hendriks</SelectItem>
          </SelectContent>
        </Select>

        <Select value={due} onValueChange={(v) => update({ due: v })}>
          <SelectTrigger className="h-9 w-[140px]" aria-label="Deadline">
            <SelectValue placeholder="Deadline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="7d">7 dagen</SelectItem>
            <SelectItem value="14d">14 dagen</SelectItem>
            <SelectItem value="30d">30 dagen</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="h-9 w-[180px]" aria-label="Sorteren">
            <SelectValue placeholder="Sorteren" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Nieuwste activiteit</SelectItem>
            <SelectItem value="due">Deadline</SelectItem>
            <SelectItem value="health">Gezondheid</SelectItem>
            <SelectItem value="name">Naam</SelectItem>
          </SelectContent>
        </Select>

        <Select value={pageSize} onValueChange={(v) => update({ pageSize: v })}>
          <SelectTrigger className="h-9 w-[120px]" aria-label="Aantal per pagina">
            <SelectValue placeholder="Aantal" />
          </SelectTrigger>
          <SelectContent>
            {['10','25','50'].map(s => <SelectItem key={s} value={s}>{s}/p</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={group} onValueChange={(v) => update({ group: v })}>
          <SelectTrigger className="h-9 w-[160px]" aria-label="Groeperen">
            <SelectValue placeholder="Groeperen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Geen groepering</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="health">Gezondheid</SelectItem>
            <SelectItem value="duePeriod">Deadline-periode</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" className="h-9" onClick={() => setDensity(density === 'roomy' ? 'compact' : 'roomy')}>
            {density === 'roomy' ? 'Compact' : 'Ruim'}
          </Button>
          {/* Saved Views dropdown */}
          {views.length > 0 && (
            <Select onValueChange={(name) => { const v = views.find(x => x.name === name); if (v) applyView(v) }}>
              <SelectTrigger className="h-9 w-[200px]" aria-label="Weergaven">
                <SelectValue placeholder="Weergaven" />
              </SelectTrigger>
              <SelectContent>
                {views.map(v => (
                  <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!saveMode ? (
            <Button variant="outline" className="h-9" onClick={() => setSaveMode(true)}>Opslaan als view</Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input className="h-9 w-48" value={viewName} onChange={(e) => setViewName(e.target.value)} aria-label="Naam weergave" />
              <Button className="h-9" onClick={saveCurrentView}>Opslaan</Button>
              <Button variant="outline" className="h-9" onClick={() => setSaveMode(false)}>Annuleer</Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs">
        {(
          [
            ['owner','Eigenaar'],
            ['openTasks','Open taken'],
            ['overdueTasks','Overdue'],
            ['dueDate','Deadline'],
            ['health','Gezondheid'],
          ] as [ColumnKey, string][]
        ).map(([k, label]) => (
          <label key={k} className="inline-flex items-center gap-2">
            <Checkbox checked={visible[k]} onCheckedChange={(v) => { const next = { ...visible, [k]: !!v }; setVisible(next) }} />
            <span>{label}</span>
          </label>
        ))}
      </div>

      {views.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {views.map(v => (
            <button key={v.name} onClick={() => deleteView(v.name)} className="underline-offset-2 hover:underline">Verwijder “{v.name}”</button>
          ))}
        </div>
      )}
    </div>
  )
}

