
import { useState, useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Plus, Filter, ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { TaskGroupHeader } from './TaskGroupHeader'
import { EditableCell } from './EditableCell'
import { StatusBadge } from './StatusBadge'
import type { TaskWithFields, ProjectField, ProjectGroup } from '../lib/types'

interface ProjectTaskTableProps {
  projectId: string
  tasks: TaskWithFields[]
  fields: ProjectField[]
  groups: ProjectGroup[]
  onTaskUpdate: (taskId: string, updates: Partial<TaskWithFields>) => void
  onTaskCreate: (groupId: string, task: Partial<TaskWithFields>) => void
  onFieldUpdate: (fieldId: string, updates: Partial<ProjectField>) => void
}

export function ProjectTaskTable({ 
  projectId, 
  tasks, 
  fields, 
  groups, 
  onTaskUpdate, 
  onTaskCreate,
  onFieldUpdate 
}: ProjectTaskTableProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Group tasks by group
  const groupedTasks = useMemo(() => {
    const grouped = new Map<string, TaskWithFields[]>()
    
    // Initialize all groups
    groups.forEach(group => {
      grouped.set(group.id, [])
    })
    
    // Add ungrouped tasks
    grouped.set('ungrouped', [])
    
    // Sort tasks into groups
    tasks.forEach(task => {
      const groupId = task.groupId || 'ungrouped'
      const groupTasks = grouped.get(groupId) || []
      groupTasks.push(task)
      grouped.set(groupId, groupTasks)
    })
    
    // Sort tasks within each group by position
    grouped.forEach((groupTasks, groupId) => {
      groupTasks.sort((a, b) => (a.position || 0) - (b.position || 0))
    })
    
    return grouped
  }, [tasks, groups])

  const visibleFields = fields.filter(f => !f.archived).sort((a, b) => a.orderIndex - b.orderIndex)

  const handleTaskSelect = (taskId: string, selected: boolean) => {
    const newSelected = new Set(selectedTasks)
    if (selected) {
      newSelected.add(taskId)
    } else {
      newSelected.delete(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTasks(new Set(tasks.map(t => t.id)))
    } else {
      setSelectedTasks(new Set())
    }
  }

  const toggleGroupCollapse = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId)
    } else {
      newCollapsed.add(groupId)
    }
    setCollapsedGroups(newCollapsed)
  }

  const updateTaskField = (taskId: string, fieldKey: string, value: any) => {
    if (fieldKey === 'title') {
      onTaskUpdate(taskId, { title: value })
    } else if (fieldKey === 'status') {
      onTaskUpdate(taskId, { status: value })
    } else if (fieldKey === 'dueAt') {
      onTaskUpdate(taskId, { dueAt: value })
    } else {
      // Custom field
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        onTaskUpdate(taskId, {
          fields: { ...task.fields, [fieldKey]: value }
        })
      }
    }
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-background overflow-hidden">
      {/* Table Header */}
      <div className="bg-muted/30 border-b border-border/40 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button variant="ghost" size="sm">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              Sort
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Item
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="bg-background border-b border-border/40 sticky top-0 z-10">
        <div className="grid gap-0" style={{ gridTemplateColumns: `40px 250px 120px 150px repeat(${visibleFields.length}, 150px)` }}>
          <div className="p-3 border-r border-border/20">
            <Checkbox
              checked={selectedTasks.size === tasks.length && tasks.length > 0}
              onCheckedChange={handleSelectAll}
            />
          </div>
          
          <div className="p-3 border-r border-border/20 font-medium text-sm">Item</div>
          <div className="p-3 border-r border-border/20 font-medium text-sm">Status</div>
          <div className="p-3 border-r border-border/20 font-medium text-sm">Due Date</div>
          
          {visibleFields.map(field => (
            <div key={field.id} className="p-3 border-r border-border/20 font-medium text-sm">
              <EditableCell
                value={field.label}
                field={{ ...field, type: 'text' }}
                onSave={(value) => onFieldUpdate(field.id, { label: value })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Task Groups */}
      <div className="max-h-[600px] overflow-auto">
        {[...groups, { id: 'ungrouped', label: 'Items', color: '#9CA3AF', key: 'ungrouped', projectId, orderIndex: 999 }].map(group => {
          const groupTasks = groupedTasks.get(group.id) || []
          const isCollapsed = collapsedGroups.has(group.id)
          
          if (groupTasks.length === 0) return null

          return (
            <div key={group.id} className="border-b border-border/40 last:border-b-0">
              <TaskGroupHeader
                group={group}
                tasks={groupTasks}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => toggleGroupCollapse(group.id)}
                onAddTask={() => onTaskCreate(group.id, { title: 'New Task', groupId: group.id === 'ungrouped' ? null : group.id })}
              />
              
              {!isCollapsed && (
                <div>
                  {groupTasks.map(task => (
                    <div
                      key={task.id}
                      className="grid gap-0 hover:bg-muted/20 border-b border-border/10 last:border-b-0"
                      style={{ gridTemplateColumns: `40px 250px 120px 150px repeat(${visibleFields.length}, 150px)` }}
                    >
                      <div className="p-3 border-r border-border/20 flex items-center">
                        <Checkbox
                          checked={selectedTasks.has(task.id)}
                          onCheckedChange={(checked) => handleTaskSelect(task.id, !!checked)}
                        />
                      </div>
                      
                      <div className="p-0 border-r border-border/20">
                        <EditableCell
                          value={task.title}
                          field={{ id: 'title', key: 'title', label: 'Title', type: 'text' } as ProjectField}
                          onSave={(value) => updateTaskField(task.id, 'title', value)}
                        />
                      </div>
                      
                      <div className="p-2 border-r border-border/20 flex items-center">
                        <StatusBadge
                          status={task.status || 'todo'}
                          onClick={() => {
                            // Cycle through statuses
                            const statuses = ['todo', 'working_on_it', 'done', 'stuck']
                            const currentIndex = statuses.indexOf(task.status || 'todo')
                            const nextIndex = (currentIndex + 1) % statuses.length
                            updateTaskField(task.id, 'status', statuses[nextIndex])
                          }}
                        />
                      </div>
                      
                      <div className="p-0 border-r border-border/20">
                        <EditableCell
                          value={task.dueAt}
                          field={{ id: 'dueAt', key: 'dueAt', label: 'Due Date', type: 'date' } as ProjectField}
                          onSave={(value) => updateTaskField(task.id, 'dueAt', value)}
                        />
                      </div>
                      
                      {visibleFields.map(field => (
                        <div key={field.id} className="p-0 border-r border-border/20">
                          <EditableCell
                            value={task.fields[field.key]}
                            field={field}
                            onSave={(value) => updateTaskField(task.id, field.key, value)}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
