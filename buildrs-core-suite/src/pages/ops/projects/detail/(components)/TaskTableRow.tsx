
import { Checkbox } from '@/components/ui/checkbox'
import { FieldEditor } from './FieldEditor'
import type { TaskWithFields, ProjectField, ProjectGroup } from '../lib/types'

interface TaskTableRowProps {
  task: TaskWithFields
  fields: ProjectField[]
  groups: ProjectGroup[]
  isSelected: boolean
  isEven: boolean
  onSelect: (selected: boolean) => void
  onUpdateField: (fieldId: string, value: any) => void
}

export function TaskTableRow({
  task,
  fields,
  groups,
  isSelected,
  isEven,
  onSelect,
  onUpdateField,
}: TaskTableRowProps) {
  const groupName = task.groupId 
    ? groups.find(g => g.id === task.groupId)?.label || 'Unknown'
    : 'No Group'

  return (
    <tr className={`hover:bg-muted/50 ${isEven ? 'bg-background' : 'bg-muted/20'} ${isSelected ? 'bg-primary/10' : ''}`}>
      {/* Select checkbox */}
      <td className="p-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(!!checked)}
          aria-label={`Select task ${task.title}`}
        />
      </td>
      
      {/* Task title */}
      <td className="p-3">
        <div className="font-medium">{task.title}</div>
      </td>
      
      {/* Status */}
      <td className="p-3">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          {task.status || 'Open'}
        </span>
      </td>
      
      {/* Assignee */}
      <td className="p-3">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <>
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                {task.assignee.initials}
              </div>
              <span className="text-sm">{task.assignee.name}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Unassigned</span>
          )}
        </div>
      </td>
      
      {/* Group */}
      <td className="p-3">
        <span className="text-sm">{groupName}</span>
      </td>
      
      {/* Due date */}
      <td className="p-3">
        <span className="text-sm">
          {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : '—'}
        </span>
      </td>
      
      {/* Custom fields */}
      {fields.map(field => (
        <td key={field.id} className="p-3">
          <FieldEditor
            field={field}
            value={task.fields[field.id]}
            onSave={(value) => onUpdateField(field.id, value)}
          />
        </td>
      ))}
      
      {/* Actions */}
      <td className="p-3">
        {/* Actions menu can be added here */}
      </td>
    </tr>
  )
}
