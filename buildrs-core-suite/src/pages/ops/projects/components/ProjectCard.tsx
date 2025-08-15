
'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pin, Calendar, Users, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Project } from '../lib/types'
import { StatusBadge } from './StatusBadge'
import { ProjectHealthBadge } from './ProjectHealthBadge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate()
  const [isPinned, setIsPinned] = useState(project.favorite)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleCardClick = () => {
    navigate(`/ops/projects/${project.id}`)
  }

  const handlePinToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsUpdating(true)
    
    // Optimistic update
    setIsPinned(!isPinned)
    
    try {
      // TODO: Implement pin/unpin API call
      console.log('Toggle pin for project:', project.id)
    } catch (error) {
      // Revert on error
      setIsPinned(isPinned)
      console.error('Failed to toggle pin:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Calculate task completion percentage
  const totalTasks = project.openTasks + (project.overdueTasks || 0)
  const completedTasks = Math.max(0, totalTasks - project.openTasks)
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // Generate label colors deterministically
  const getLabelColor = (label: string) => {
    const colors = [
      'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'bg-green-500/10 text-green-500 border-green-500/20',
      'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'bg-pink-500/10 text-pink-500 border-pink-500/20',
      'bg-teal-500/10 text-teal-500 border-teal-500/20'
    ]
    const hash = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <TooltipProvider>
      <div
        className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-md transition duration-200 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Pin Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-2 right-2 z-10 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${isPinned ? 'opacity-100 text-amber-500' : ''}`}
              onClick={handlePinToggle}
              disabled={isUpdating}
              aria-label={isPinned ? 'Unpin project' : 'Pin project'}
            >
              <Pin className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isPinned ? 'Unpin project' : 'Pin project'}</TooltipContent>
        </Tooltip>

        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between pr-8">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 font-medium text-foreground/90 group-hover:text-foreground">
                {project.name}
              </h3>
              {project.id && (
                <p className="text-xs text-muted-foreground mt-1">
                  #{project.id.slice(-6).toUpperCase()}
                </p>
              )}
            </div>
          </div>

          {/* Labels */}
          {project.name && (
            <div className="flex flex-wrap gap-1">
              {/* Mock labels for demo - in real implementation, use project.labels */}
              {['Frontend', 'High Priority'].map((label) => (
                <Badge
                  key={label}
                  variant="outline"
                  className={`text-xs px-2 py-0.5 ${getLabelColor(label)}`}
                >
                  {label}
                </Badge>
              ))}
            </div>
          )}

          {/* Status and Health */}
          <div className="flex items-center gap-2">
            <StatusBadge value={project.status} />
            <ProjectHealthBadge value={project.health} />
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-muted-foreground">
                {completedTasks}/{totalTasks} tasks
              </span>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            {/* Owner */}
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-muted">
                  {project.owner.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                {project.owner.name}
              </span>
            </div>

            {/* Updated */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
            </div>
          </div>

          {/* Overdue indicator */}
          {project.overdueTasks > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-500/10 px-2 py-1 rounded">
              <AlertTriangle className="h-3 w-3" />
              {project.overdueTasks} overdue tasks
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
