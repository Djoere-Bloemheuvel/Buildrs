'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  q: string
  status: string
  assigneeId: string
  onChange: (next: { q?: string; status?: string; assigneeId?: string }) => void
  onNewTask: () => void
  onCustomize: () => void
  onExport: () => void
}

export function TaskToolbar({ q, status, assigneeId, onChange, onNewTask, onCustomize, onExport }: Props) {
  const [localQ, setLocalQ] = useState(q)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setLocalQ(q) }, [q])

  function onQChange(v: string) {
    setLocalQ(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange({ q: v || undefined }), 300)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input className="h-9 w-72" placeholder="Zoeken…" value={localQ} onChange={(e) => onQChange(e.target.value)} />
      <Select value={status} onValueChange={(v) => onChange({ status: v })}>
        <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle statussen</SelectItem>
          <SelectItem value="todo">Te doen</SelectItem>
          <SelectItem value="in_progress">Bezig</SelectItem>
          <SelectItem value="review">Review</SelectItem>
          <SelectItem value="done">Klaar</SelectItem>
          <SelectItem value="blocked">Geblokkeerd</SelectItem>
        </SelectContent>
      </Select>
      <Select value={assigneeId} onValueChange={(v) => onChange({ assigneeId: v })}>
        <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Toegewezen" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Iedereen</SelectItem>
          {/* TODO: populate with project members */}
        </SelectContent>
      </Select>
      <div className="ml-auto flex items-center gap-2">
        <button className="h-9 rounded-md border px-3 text-sm" onClick={onExport}>Export CSV</button>
        <button className="h-9 rounded-md border px-3 text-sm" onClick={onCustomize}>Customize Columns</button>
        <button className="h-9 rounded-md bg-primary text-primary-foreground px-3 text-sm" onClick={onNewTask}>Nieuwe taak</button>
      </div>
    </div>
  )
}

