
import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { ProjectGroup, TaskWithFields } from '../lib/types'

interface TaskGroupHeaderProps {
  group: ProjectGroup
  tasks: TaskWithFields[]
  isCollapsed: boolean
  onToggleCollapse: () => void
  onAddTask: () => void
}

export function TaskGroupHeader({ group, tasks, isCollapsed, onToggleCollapse, onAddTask }: TaskGroupHeaderProps) {
  const completedTasks = tasks.filter(task => task.status === 'done').length
  const totalTasks = tasks.length
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border/40">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-6 w-6 p-0"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: group.color }}
        />
        
        <h3 className="font-medium text-sm">{group.label}</h3>
        
        <span className="text-xs text-muted-foreground">
          {completedTasks}/{totalTasks}
        </span>
        
        {totalTasks > 0 && (
          <div className="flex items-center gap-2">
            <Progress value={progress} className="w-16 h-1" />
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddTask}
          className="h-6 w-6 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
