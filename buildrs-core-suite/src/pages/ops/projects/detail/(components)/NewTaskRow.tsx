
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProjectField, ProjectGroup } from '../lib/types'

interface NewTaskRowProps {
  projectId: string
  fields: ProjectField[]
  groups: ProjectGroup[]
  onSave: (task: { title: string; groupId: string | null }) => void
  onCancel: () => void
}

export function NewTaskRow({ 
  projectId, 
  fields, 
  groups, 
  onSave, 
  onCancel 
}: NewTaskRowProps) {
  const [title, setTitle] = useState('')

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      groupId: null,
    })
    setTitle('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter task title..."
          autoFocus
        />
      </div>
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          onClick={handleSave}
          disabled={!title.trim()}
        >
          Save
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
