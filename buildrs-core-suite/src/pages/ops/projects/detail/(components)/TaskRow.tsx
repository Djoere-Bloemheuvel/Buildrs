
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, MoreHorizontal } from 'lucide-react'
import type { TaskWithFields, ProjectField, ProjectGroup } from '../lib/types'

interface TaskRowProps {
  task: TaskWithFields
  fields: ProjectField[]
  groups: ProjectGroup[]
  onUpdate: (updates: Partial<TaskWithFields>) => void
}

export function TaskRow({ task, fields, groups, onUpdate }: TaskRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValues, setEditValues] = useState({
    title: task.title,
    status: task.status || '',
    groupId: task.groupId || '',
    dueAt: task.dueAt || '',
    ...task.fields
  })

  const handleSave = () => {
    const { title, status, groupId, dueAt, ...fieldValues } = editValues
    onUpdate({
      title,
      status: status || null,
      groupId: groupId || null,
      dueAt: dueAt || null,
      fields: fieldValues
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValues({
      title: task.title,
      status: task.status || '',
      groupId: task.groupId || '',
      dueAt: task.dueAt || '',
      ...task.fields
    })
    setIsEditing(false)
  }

  const group = groups.find(g => g.id === task.groupId)
  const dueDate = task.dueAt ? new Date(task.dueAt).toLocaleDateString() : '—'
  const updatedDate = new Date(task.updatedAt).toLocaleDateString()

  if (isEditing) {
    return (
      <tr className="border-b border-border/20">
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            <Button size="sm" onClick={handleSave} variant="outline">
              ✓
            </Button>
            <Button size="sm" onClick={handleCancel} variant="outline">
              ✕
            </Button>
          </div>
        </td>
        <td className="px-3 py-2">
          <Input
            value={editValues.title}
            onChange={(e) => setEditValues(prev => ({ ...prev, title: e.target.value }))}
            className="min-w-[200px]"
          />
        </td>
        <td className="px-3 py-2">
          <Select value={editValues.status} onValueChange={(value) => setEditValues(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">Bezig</SelectItem>
              <SelectItem value="done">Klaar</SelectItem>
              <SelectItem value="blocked">Geblokkeerd</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="px-3 py-2">
          <div className="text-sm text-muted-foreground">—</div>
        </td>
        <td className="px-3 py-2">
          <Select value={editValues.groupId} onValueChange={(value) => setEditValues(prev => ({ ...prev, groupId: value }))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Groep" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Geen groep</SelectItem>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="px-3 py-2">
          <Input
            type="date"
            value={editValues.dueAt ? editValues.dueAt.split('T')[0] : ''}
            onChange={(e) => setEditValues(prev => ({ ...prev, dueAt: e.target.value ? `${e.target.value}T23:59:59` : '' }))}
            className="w-[140px]"
          />
        </td>
        {fields.map(field => (
          <td key={field.id} className="px-3 py-2">
            <FieldEditor
              field={field}
              value={editValues[field.key]}
              onChange={(value) => setEditValues(prev => ({ ...prev, [field.key]: value }))}
            />
          </td>
        ))}
        <td className="px-3 py-2">{updatedDate}</td>
        <td className="px-3 py-2"></td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-border/20 hover:bg-muted/50">
      <td className="px-3 py-2">
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
          ✏️
        </Button>
      </td>
      <td className="px-3 py-2">
        <div className="font-medium">{task.title}</div>
      </td>
      <td className="px-3 py-2">
        <StatusBadge status={task.status} />
      </td>
      <td className="px-3 py-2">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-muted text-[11px]">
              {task.assignee.initials}
            </div>
            <span className="text-sm">{task.assignee.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        {group ? (
          <div className="flex items-center gap-2">
            <div 
              className="h-2 w-2 rounded-full" 
              style={{ backgroundColor: group.color }}
            />
            <span className="text-sm">{group.label}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        <span className="text-sm">{dueDate}</span>
      </td>
      {fields.map(field => (
        <td key={field.id} className="px-3 py-2">
          <FieldDisplay field={field} value={task.fields[field.key]} />
        </td>
      ))}
      <td className="px-3 py-2">
        <span className="text-sm text-muted-foreground">{updatedDate}</span>
      </td>
      <td className="px-3 py-2">
        <Button size="sm" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  )
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-sm text-muted-foreground">—</span>
  
  const statusConfig = {
    open: { label: 'Open', className: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'Bezig', className: 'bg-yellow-100 text-yellow-800' },
    done: { label: 'Klaar', className: 'bg-green-100 text-green-800' },
    blocked: { label: 'Geblokkeerd', className: 'bg-red-100 text-red-800' }
  }
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

function FieldDisplay({ field, value }: { field: ProjectField; value: any }) {
  if (!value) return <span className="text-sm text-muted-foreground">—</span>
  
  switch (field.type) {
    case 'boolean':
      return <span className="text-sm">{value ? '✓' : '✗'}</span>
    case 'date':
    case 'datetime':
      return <span className="text-sm">{new Date(value).toLocaleDateString()}</span>
    case 'number':
    case 'money':
      return <span className="text-sm">{value}</span>
    default:
      return <span className="text-sm">{String(value)}</span>
  }
}

function FieldEditor({ field, value, onChange }: { field: ProjectField; value: any; onChange: (value: any) => void }) {
  switch (field.type) {
    case 'text':
    case 'richtext':
      return (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-[120px]"
        />
      )
    case 'number':
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="w-[100px]"
        />
      )
    case 'boolean':
      return (
        <Select value={value ? 'true' : 'false'} onValueChange={(val) => onChange(val === 'true')}>
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Ja</SelectItem>
            <SelectItem value="false">Nee</SelectItem>
          </SelectContent>
        </Select>
      )
    case 'select':
      const options = field.options?.options || []
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: any) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'date':
    case 'datetime':
      return (
        <Input
          type="date"
          value={value ? value.split('T')[0] : ''}
          onChange={(e) => onChange(e.target.value ? `${e.target.value}T00:00:00` : null)}
          className="w-[140px]"
        />
      )
    default:
      return (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-[120px]"
        />
      )
  }
}
