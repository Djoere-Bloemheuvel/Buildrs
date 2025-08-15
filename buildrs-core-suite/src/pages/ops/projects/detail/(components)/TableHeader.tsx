
import { Checkbox } from '@/components/ui/checkbox'
import type { ProjectField, ProjectGroup } from '../lib/types'

interface TableHeaderProps {
  fields: ProjectField[]
  groups: ProjectGroup[]
  selectedCount: number
  totalCount: number
  onSelectAll: (selected: boolean) => void
}

export function TableHeader({ 
  fields, 
  groups, 
  selectedCount, 
  totalCount, 
  onSelectAll 
}: TableHeaderProps) {
  const isAllSelected = selectedCount === totalCount && totalCount > 0
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount

  return (
    <thead className="sticky top-0 bg-background border-b border-border/40">
      <tr>
        {/* Select column */}
        <th className="w-12 p-3 text-left">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={(checked) => onSelectAll(!!checked)}
            aria-label="Select all"
            className={isPartiallySelected ? "data-[state=checked]:bg-primary/50" : ""}
          />
        </th>
        
        {/* Task title column */}
        <th className="min-w-[300px] p-3 text-left text-sm font-medium text-muted-foreground">
          Task
        </th>
        
        {/* Status column */}
        <th className="w-32 p-3 text-left text-sm font-medium text-muted-foreground">
          Status
        </th>
        
        {/* Assignee column */}
        <th className="w-40 p-3 text-left text-sm font-medium text-muted-foreground">
          Assignee
        </th>
        
        {/* Group column */}
        <th className="w-32 p-3 text-left text-sm font-medium text-muted-foreground">
          Group
        </th>
        
        {/* Due date column */}
        <th className="w-32 p-3 text-left text-sm font-medium text-muted-foreground">
          Due Date
        </th>
        
        {/* Custom fields */}
        {fields.map(field => (
          <th 
            key={field.id} 
            className="w-40 p-3 text-left text-sm font-medium text-muted-foreground"
          >
            {field.label}
          </th>
        ))}
        
        {/* Actions column */}
        <th className="w-16 p-3"></th>
      </tr>
    </thead>
  )
}
