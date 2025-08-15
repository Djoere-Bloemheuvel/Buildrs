'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ProjectGroup, TaskWithFields } from '../lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTask, updateTaskPositionAndGroup } from '../lib/mutations'

type Props = { projectId: string; groups: ProjectGroup[]; tasks: TaskWithFields[] }

export function BoardView({ projectId, groups, tasks }: Props) {
  const [lanes, setLanes] = useState(() => groupTasks(groups, tasks))

  useEffect(() => { setLanes(groupTasks(groups, tasks)) }, [groups, tasks])

  async function onDrop(taskId: string, toGroupId: string | null, toIndex: number) {
    setLanes(prev => moveOptimistic(prev, taskId, toGroupId, toIndex))
    try { await updateTaskPositionAndGroup(taskId, toGroupId, toIndex) } catch { /* TODO toast */ }
  }

  async function onQuickAdd(groupId: string | null, title: string) {
    const laneId = groupId || 'nogroup'
    const pos = (lanes.get(laneId)?.length || 0)
    const draftId = `tmp_${Math.random().toString(36).slice(2)}`
    setLanes(prev => {
      const next = new Map(prev)
      const list = next.get(laneId) ? [...(next.get(laneId) as TaskWithFields[])] : []
      list.push({ id: draftId, projectId, title, assignee: null, status: 'open', groupId, dueAt: undefined, startAt: undefined, position: pos, updatedAt: new Date().toISOString(), fields: {} })
      next.set(laneId, list)
      return next
    })
    try {
      const created = await createTask(projectId, title, groupId, pos)
      setLanes(prev => replaceTemp(prev, draftId, {
        id: created.id, projectId: projectId, title: created.title,
        groupId: created.group_id ?? undefined, position: created.position ?? 0,
        status: created.status, dueAt: created.due_at ?? undefined, startAt: undefined,
        updatedAt: created.updated_at, assignee: null, fields: {}
      }))
    } catch {
      // revert
      setLanes(prev => removeTask(prev, draftId))
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {renderLane({ id: 'nogroup', label: 'Zonder groep', color: '#9CA3AF', tasks: lanes.get('nogroup') || [], onDrop, onQuickAdd })}
      {groups.map(g => renderLane({ id: g.id, label: g.label, color: g.color, tasks: lanes.get(g.id) || [], onDrop, onQuickAdd }))}
    </div>
  )
}

function renderLane({ id, label, color, tasks, onDrop, onQuickAdd }: { id: string; label: string; color: string; tasks: TaskWithFields[]; onDrop: (taskId: string, toGroupId: string|null, toIndex: number) => void; onQuickAdd: (groupId: string|null, title: string) => void }) {
  return (
    <section key={id} className="rounded-2xl border border-border/40 bg-background/40 p-3 min-h-[260px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-sm font-medium">{label}</h3>
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        </div>
      </div>
      <div className="space-y-2">
        {tasks.map((t, idx) => (
          <Card key={t.id} task={t} index={idx} onDrop={(toIdx) => onDrop(t.id, id === 'nogroup' ? null : id, toIdx)} />
        ))}
        <QuickAdd onAdd={(title) => onQuickAdd(id === 'nogroup' ? null : id, title)} />
      </div>
    </section>
  )
}

function Card({ task, index, onDrop }: { task: TaskWithFields; index: number; onDrop: (toIndex: number) => void }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-3" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const fromIdx = Number(e.dataTransfer.getData('text/plain')); if (!Number.isNaN(fromIdx)) onDrop(index) }}>
      <div className="text-sm font-medium truncate">{task.title}</div>
      <div className="text-xs text-muted-foreground">{task.status || 'open'} · {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : '—'}</div>
    </div>
  )
}

function QuickAdd({ onAdd }: { onAdd: (title: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!val.trim()) return; onAdd(val.trim()); setVal('') }} className="flex items-center gap-2">
      <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Nieuwe taak…" className="h-8" />
      <Button type="submit" size="sm" variant="outline">Voeg toe</Button>
    </form>
  )
}

function groupTasks(groups: ProjectGroup[], tasks: TaskWithFields[]) {
  const map = new Map<string, TaskWithFields[]>()
  map.set('nogroup', [])
  for (const g of groups) map.set(g.id, [])
  for (const t of tasks) {
    const key = t.groupId || 'nogroup'
    const list = map.get(key) || []
    list.push(t)
    map.set(key, list)
  }
  for (const [k, list] of map) map.set(k, list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)))
  return map
}

function moveOptimistic(state: Map<string, TaskWithFields[]>, taskId: string, toGroupId: string | null, toIndex: number) {
  const next = new Map<string, TaskWithFields[]>(state)
  let found: { fromKey: string; task: TaskWithFields } | null = null
  for (const [k, list] of next) {
    const idx = list.findIndex(t => t.id === taskId)
    if (idx !== -1) {
      const [task] = list.splice(idx, 1)
      next.set(k, list)
      found = { fromKey: k, task }
      break
    }
  }
  if (!found) return next
  const destKey = toGroupId || 'nogroup'
  const dest = next.get(destKey) ? [...(next.get(destKey) as TaskWithFields[])] : []
  const clampedIndex = Math.max(0, Math.min(dest.length, toIndex))
  found.task.groupId = toGroupId || undefined
  dest.splice(clampedIndex, 0, found.task)
  dest.forEach((t, i) => { t.position = i })
  next.set(destKey, dest)
  return next
}

function replaceTemp(state: Map<string, TaskWithFields[]>, tempId: string, real: TaskWithFields) {
  const next = new Map(state)
  for (const [k, list] of next) {
    const idx = list.findIndex(t => t.id === tempId)
    if (idx !== -1) {
      const copy = [...list]
      copy[idx] = real
      next.set(k, copy)
      break
    }
  }
  return next
}

function removeTask(state: Map<string, TaskWithFields[]>, taskId: string) {
  const next = new Map(state)
  for (const [k, list] of next) {
    const idx = list.findIndex(t => t.id === taskId)
    if (idx !== -1) {
      const copy = [...list]
      copy.splice(idx, 1)
      next.set(k, copy)
      break
    }
  }
  return next
}
