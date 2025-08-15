'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { ProjectField } from '../lib/types'
import type { ColumnConfig, ProjectViewConfig } from '../lib/config'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  fields: ProjectField[]
  initialConfig: ProjectViewConfig
  onSave: (config: ProjectViewConfig) => Promise<void>
}

export function ProjectCustomizeDrawer({ open, onOpenChange, fields, initialConfig, onSave }: Props) {
  const [config, setConfig] = useState<ProjectViewConfig>(initialConfig)

  useEffect(() => { setConfig(initialConfig) }, [initialConfig])

  const fieldMap = useMemo(() => new Map(fields.map(f => [f.id, f])), [fields])

  function updateColumn(id: string, patch: Partial<ColumnConfig>) {
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.map(c => c.id === id ? { ...c, ...patch } : c)
    }))
  }

  function addColumn(fieldId: string) {
    const f = fieldMap.get(fieldId)
    if (!f) return
    setConfig(prev => ({
      ...prev,
      columns: [
        ...prev.columns,
        { id: f.id, key: f.key, label: f.label, type: 'text', visible: true },
      ]
    }))
  }

  async function handleSave() {
    await onSave(config)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kolommen aanpassen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={config.density} onValueChange={(v) => setConfig(prev => ({ ...prev, density: v as any }))}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="comfortable">Ruim</SelectItem>
              </SelectContent>
            </Select>
            <Select value={config.ordering || 'position'} onValueChange={(v) => setConfig(prev => ({ ...prev, ordering: v as any }))}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="position">Volgorde</SelectItem>
                <SelectItem value="due_date">Deadline</SelectItem>
                <SelectItem value="priority">Prioriteit</SelectItem>
                <SelectItem value="updated_at">Laatst bijgewerkt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {config.columns.map(col => (
              <div key={col.id} className="flex items-center gap-2 border rounded-md p-2">
                <Checkbox checked={col.visible} onCheckedChange={(v) => updateColumn(col.id, { visible: !!v })} />
                <Input value={col.label} onChange={(e) => updateColumn(col.id, { label: e.target.value })} className="w-56" />
                <Select value={col.type} onValueChange={(v) => updateColumn(col.id, { type: v as any })}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['status','person','date','text','long_text','number','label','priority','checkbox','link'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Select onValueChange={addColumn}>
              <SelectTrigger className="w-72"><SelectValue placeholder="Kolom toevoegen op basis van veld" /></SelectTrigger>
              <SelectContent>
                {fields.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={handleSave}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

