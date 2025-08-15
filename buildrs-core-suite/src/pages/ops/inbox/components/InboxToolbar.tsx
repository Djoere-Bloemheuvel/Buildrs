'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const DENSITY_KEY = 'ops_inbox_density_v1'

export function useDensity() {
  const [density, setDensity] = useState<'compact' | 'roomy'>(() => (localStorage.getItem(DENSITY_KEY) as any) || 'roomy')
  useEffect(() => { localStorage.setItem(DENSITY_KEY, density) }, [density])
  return { density, setDensity }
}

export function InboxToolbar() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [localQ, setLocalQ] = useState(params.get('q') ?? '')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === '/') { e.preventDefault(); searchInputRef.current?.focus() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const type = params.get('type') ?? 'all'
  const priority = params.get('priority') ?? 'all'
  const source = params.get('source') ?? 'all'
  const mine = params.get('mine') === '1'
  const pageSize = params.get('pageSize') ?? '25'
  const sort = params.get('sort') ?? 'newest'

  function update(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams(params.toString())
    Object.entries(next).forEach(([k, v]) => { if (!v) sp.delete(k); else sp.set(k, v) })
    sp.set('page', '1')
    nav({ pathname: '/ops/inbox', search: `?${sp.toString()}` })
  }

  const canBulk = false // v1 UI-only

  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 p-4 sticky top-0 z-10">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[160px]">
          <div className="text-sm font-medium mb-1">Filters</div>
          <div className="inline-flex items-center gap-1 rounded-lg p-1 bg-muted">
            {[
              ['all', 'Alle'],
              ['needs_approval', 'Needs'],
              ['workflow_issue', 'Issues'],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => update({ type: val })}
                className={`px-2 py-1 text-xs rounded-md ${type === val ? 'bg-background shadow' : 'opacity-80 hover:opacity-100'}`}
                aria-pressed={type === val}
              >{label}</button>
            ))}
          </div>
        </div>

        <Input
          ref={searchInputRef}
          className="h-9 w-64"
          placeholder="Zoeken…"
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') update({ q: localQ || undefined }) }}
          aria-label="Zoeken"
        />

        <Select value={priority} onValueChange={(v) => update({ priority: v === 'all' ? undefined : v })}>
          <SelectTrigger className="h-9 w-[140px]" aria-label="Prioriteit">
            <SelectValue placeholder="Prioriteit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={source} onValueChange={(v) => update({ source: v })}>
          <SelectTrigger className="h-9 w-[140px]" aria-label="Bron">
            <SelectValue placeholder="Bron" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="ops">Ops</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Checkbox id="mine" checked={mine} onCheckedChange={(v) => update({ mine: v ? '1' : undefined })} />
          <label htmlFor="mine" className="text-sm">Aan mij</label>
        </div>

        <Select value={pageSize} onValueChange={(v) => update({ pageSize: v })}>
          <SelectTrigger className="h-9 w-[120px]" aria-label="Aantal per pagina">
            <SelectValue placeholder="Aantal" />
          </SelectTrigger>
          <SelectContent>
            {['10','25','50'].map(s => <SelectItem key={s} value={s}>{s}/p</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="h-9 w-[140px]" aria-label="Sorteren">
            <SelectValue placeholder="Sorteren" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Nieuwste</SelectItem>
            <SelectItem value="oldest">Oudste</SelectItem>
            <SelectItem value="priority">Prioriteit</SelectItem>
            <SelectItem value="age">Leeftijd</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" className="h-9" onClick={() => update({ q: localQ || undefined })}>Zoek</Button>
          <Button variant="outline" className="h-9" disabled={!canBulk}>Toewijzen</Button>
          <Button variant="outline" className="h-9" disabled={!canBulk}>Snoozen</Button>
          <Button variant="destructive" className="h-9" disabled={!canBulk}>Afwijzen</Button>
        </div>
      </div>
    </div>
  )
}

