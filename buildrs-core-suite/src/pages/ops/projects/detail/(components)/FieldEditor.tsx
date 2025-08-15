
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ProjectField } from '../lib/types'

interface FieldEditorProps {
  field: ProjectField
  value: any
  onSave: (value: any) => void
}

export function FieldEditor({ field, value, onSave }: FieldEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')

  const handleSave = () => {
    onSave(editValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(value || '')
      setIsEditing(false)
    }
  }

  const displayValue = () => {
    if (!value) return <span className="text-muted-foreground text-sm">Empty</span>
    
    switch (field.type) {
      case 'date':
        return <span className="text-sm">{new Date(value).toLocaleDateString()}</span>
      case 'number':
        return <span className="text-sm">{value}</span>
      case 'select':
        return <span className="text-sm">{value}</span>
      default:
        return <span className="text-sm">{value}</span>
    }
  }

  if (isEditing) {
    switch (field.type) {
      case 'select':
        const options = field.options?.options || []
        return (
          <Select
            value={editValue}
            onValueChange={(newValue) => {
              setEditValue(newValue)
              onSave(newValue)
              setIsEditing(false)
            }}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'date':
        return (
          <Input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full h-8"
            autoFocus
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full h-8"
            autoFocus
          />
        )
      
      default:
        return (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full h-8"
            autoFocus
          />
        )
    }
  }

  return (
    <div 
      className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 min-h-[32px] flex items-center"
      onClick={() => setIsEditing(true)}
    >
      {displayValue()}
    </div>
  )
}
