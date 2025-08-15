'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ProjectMeta, ProjectStatus, Health } from '../lib/types'

export function ProjectHeader({ meta }: { meta: ProjectMeta }) {
  const [name, setName] = useState(meta.name)
  const [status, setStatus] = useState<ProjectStatus>(meta.status)
  const [due, setDue] = useState(meta.dueDate ?? '')

  useEffect(() => { setName(meta.name); setStatus(meta.status); setDue(meta.dueDate ?? '') }, [meta])

  return (
    <div className="sticky top-0 z-10 rounded-2xl border border-border/40 bg-background/60 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <Input className="w-[360px]" value={name} onChange={(e) => setName(e.target.value)} aria-label="Projectnaam" />
        <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Actief</SelectItem>
            <SelectItem value="on_hold">Op pauze</SelectItem>
            <SelectItem value="completed">Afgerond</SelectItem>
            <SelectItem value="archived">Gearchiveerd</SelectItem>
          </SelectContent>
        </Select>
        <input type="date" className="h-9 rounded-md border bg-background px-3 text-sm" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Deadline" />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline">Nieuwe taak</Button>
          <Button variant="destructive">Archiveren</Button>
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">Laatst bijgewerkt: {new Date(meta.updatedAt).toLocaleString()}</div>
    </div>
  )
}

