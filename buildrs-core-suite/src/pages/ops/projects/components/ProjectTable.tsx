'use client'

import { useState } from 'react'
import { formatDistanceToNow, isThisMonth, format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Project } from '../lib/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronDown, Plus } from 'lucide-react'

interface ProjectTableProps {
  projects: Project[]
}

type PhaseStatus = 'done' | 'working' | 'stuck' | 'empty'

interface Phase {
  key: string
  name: string
  statuses: PhaseStatus[]
}

const defaultPhases: Phase[] = [
  { key: 'brainstorming', name: 'Brainstorming', statuses: ['done', 'working', 'stuck', 'empty'] },
  { key: 'execution', name: 'Execution', statuses: ['done', 'working', 'stuck', 'empty'] },
  { key: 'launch', name: 'Launch', statuses: ['done', 'working', 'stuck', 'empty'] }
]

const statusColors = {
  done: 'bg-green-500 text-white hover:bg-green-600',
  working: 'bg-amber-500 text-white hover:bg-amber-600',
  stuck: 'bg-red-500 text-white hover:bg-red-600',
  empty: 'bg-gray-200 text-gray-600 hover:bg-gray-300'
}

const statusLabels = {
  done: 'Done',
  working: 'Working on it',
  stuck: 'Stuck',
  empty: ''
}

// Helper function to check if a date is in the last month
function isLastMonth(date: Date): boolean {
  const lastMonth = subMonths(new Date(), 1)
  const lastMonthStart = startOfMonth(lastMonth)
  const lastMonthEnd = endOfMonth(lastMonth)
  return date >= lastMonthStart && date <= lastMonthEnd
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const [phases] = useState<Phase[]>(defaultPhases)
  
  // Group projects by time period
  const thisMonthProjects = projects.filter(p => 
    p.updatedAt && isThisMonth(new Date(p.updatedAt))
  )
  
  const lastMonthProjects = projects.filter(p => 
    p.updatedAt && isLastMonth(new Date(p.updatedAt))
  )

  const handleStatusChange = async (projectId: string, phase: string, status: PhaseStatus) => {
    // TODO: Implement API call to update project phase status
    console.log('Update status:', { projectId, phase, status })
  }

  const getProjectPhaseStatus = (project: Project, phaseKey: string): PhaseStatus => {
    // Map project status to phase status for demo
    // TODO: Implement proper phase status mapping from database
    if (project.status === 'completed') return 'done'
    if (project.status === 'active') return 'working'
    if (project.status === 'on_hold') return 'stuck'
    return 'empty'
  }

  const renderStatusPill = (project: Project, phase: Phase) => {
    const status = getProjectPhaseStatus(project, phase.key)
    
    return (
      <Select 
        value={status} 
        onValueChange={(value) => handleStatusChange(project.id, phase.key, value as PhaseStatus)}
      >
        <SelectTrigger className={`w-32 h-8 border-0 ${statusColors[status]} font-medium text-sm`}>
          <SelectValue>{statusLabels[status]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="done">Done</SelectItem>
          <SelectItem value="working">Working on it</SelectItem>
          <SelectItem value="stuck">Stuck</SelectItem>
          <SelectItem value="empty">Empty</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  const renderProgressBar = (project: Project) => {
    const statuses = phases.map(phase => getProjectPhaseStatus(project, phase.key))
    const doneCount = statuses.filter(s => s === 'done').length
    const workingCount = statuses.filter(s => s === 'working').length
    const stuckCount = statuses.filter(s => s === 'stuck').length
    const total = phases.length

    return (
      <div className="flex h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        {doneCount > 0 && (
          <div 
            className="bg-green-500" 
            style={{ width: `${(doneCount / total) * 100}%` }}
          />
        )}
        {workingCount > 0 && (
          <div 
            className="bg-amber-500" 
            style={{ width: `${(workingCount / total) * 100}%` }}
          />
        )}
        {stuckCount > 0 && (
          <div 
            className="bg-red-500" 
            style={{ width: `${(stuckCount / total) * 100}%` }}
          />
        )}
      </div>
    )
  }

  const renderSection = (title: string, sectionProjects: Project[], colorClass: string) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-1 h-6 ${colorClass} rounded-full`} />
        <h2 className="text-lg font-medium text-foreground">{title}</h2>
      </div>
      
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr className="border-b border-border/40">
                <th className="text-left p-4 font-medium text-muted-foreground w-80">Task</th>
                <th className="text-left p-4 font-medium text-muted-foreground w-24">Person</th>
                <th className="text-left p-4 font-medium text-muted-foreground w-24">Date</th>
                {phases.map(phase => (
                  <th key={phase.key} className="text-center p-4 font-medium text-muted-foreground w-36">
                    {phase.name}
                  </th>
                ))}
                <th className="w-4 p-4">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sectionProjects.map((project, index) => (
                <tr key={project.id} className="border-b border-border/20 hover:bg-muted/20">
                  <td className="p-4">
                    <div className="font-medium text-foreground">{project.name}</div>
                  </td>
                  <td className="p-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-muted">
                        {project.owner.initials}
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {project.updatedAt ? format(new Date(project.updatedAt), 'MMM dd') : ''}
                  </td>
                  {phases.map(phase => (
                    <td key={phase.key} className="p-4 text-center">
                      {renderStatusPill(project, phase)}
                    </td>
                  ))}
                  <td className="p-4"></td>
                </tr>
              ))}
              {/* Progress bars row */}
              <tr className="border-b border-border/20">
                <td className="p-4"></td>
                <td className="p-4"></td>
                <td className="p-4"></td>
                {phases.map(phase => (
                  <td key={`${phase.key}-progress`} className="p-4">
                    {renderProgressBar(sectionProjects[0] || {} as Project)}
                  </td>
                ))}
                <td className="p-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {thisMonthProjects.length > 0 && renderSection("This month", thisMonthProjects, "bg-blue-500")}
      {lastMonthProjects.length > 0 && renderSection("Last month", lastMonthProjects, "bg-red-500")}
      
      {thisMonthProjects.length === 0 && lastMonthProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
          <h3 className="text-lg font-medium">No projects found</h3>
          <p className="text-muted-foreground">Try changing filters or create a new project</p>
        </div>
      )}
    </div>
  )
}
