
import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { ProjectField } from '../lib/types'

interface EditableCellProps {
  value: any
  field: ProjectField
  onSave: (value: any) => void
  className?: string
}

export function EditableCell({ value, field, onSave, className }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    onSave(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    if (field.type === 'select' && field.options?.choices) {
      return (
        <div className="flex items-center gap-1">
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options.choices.map((choice: any) => (
                <SelectItem key={choice.value} value={choice.value}>
                  {choice.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )
    }

    if (field.type === 'date') {
      return (
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("h-8 w-full justify-start text-left font-normal", !editValue && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {editValue ? format(new Date(editValue), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={editValue ? new Date(editValue) : undefined}
                onSelect={(date) => setEditValue(date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8"
        />
        <Button size="sm" variant="ghost" onClick={handleSave}>
          <Check className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  const displayValue = () => {
    if (!value) return <span className="text-muted-foreground">-</span>
    
    if (field.type === 'date') {
      return format(new Date(value), "MMM d, yyyy")
    }
    
    if (field.type === 'select' && field.options?.choices) {
      const choice = field.options.choices.find((c: any) => c.value === value)
      return choice?.label || value
    }
    
    return value
  }

  return (
    <div
      className={cn("px-2 py-1 min-h-8 flex items-center cursor-pointer hover:bg-muted/30 rounded", className)}
      onClick={() => setIsEditing(true)}
    >
      {displayValue()}
    </div>
  )
}
