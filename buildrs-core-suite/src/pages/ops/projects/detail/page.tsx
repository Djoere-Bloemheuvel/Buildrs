
import { useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ProjectHeader } from './(components)/ProjectHeader'
import { ProjectTaskTable } from './(components)/ProjectTaskTable'
import { getProjectFields, getProjectGroups, getProjectMembers, getProjectMeta, getProjectViews, getTasksWithFields } from './lib/fetchers'
import { createTask, updateTaskCore, upsertTaskFields, updateProjectField } from './lib/mutations'
import type { ProjectField, ProjectGroup, ProjectMember, ProjectMeta, ProjectView, TaskWithFields } from './lib/types'
import { supabase } from '@/integrations/supabase/client'

export default function OpsProjectDetailPage() {
  const { projectId } = useParams()
  const [params] = useSearchParams()

  const [meta, setMeta] = useState<ProjectMeta | null>(null)
  const [fields, setFields] = useState<ProjectField[]>([])
  const [groups, setGroups] = useState<ProjectGroup[]>([])
  const [views, setViews] = useState<ProjectView[]>([])
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [tasks, setTasks] = useState<TaskWithFields[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    let active = true
    ;(async () => {
      try {
        const [m, f, g, v, mem, t] = await Promise.all([
          getProjectMeta(projectId),
          getProjectFields(projectId),
          getProjectGroups(projectId),
          getProjectViews(projectId),
          getProjectMembers(projectId),
          getTasksWithFields(projectId),
        ])
        if (!active) return
        setMeta(m)
        setFields(f)
        setGroups(g)
        setViews(v)
        setMembers(mem)
        setTasks(t)
      } catch (e: any) {
        if (!active) return
        setErr(e?.message || 'Laden mislukt')
      }
    })()
    return () => { active = false }
  }, [projectId])

  const handleTaskUpdate = async (taskId: string, updates: Partial<TaskWithFields>) => {
    // Optimistic update
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
    ))

    try {
      const { title, status, groupId, dueAt, fields: custom } = updates as any
      await updateTaskCore(taskId, { title, status, groupId, dueAt })
      if (custom) await upsertTaskFields(projectId!, taskId, custom, fields)
    } catch (error) {
      console.error('Failed to update task:', error)
      // Revert optimistic update on error
      const [t] = await Promise.all([getTasksWithFields(projectId!)])
      setTasks(t)
    }
  }

  const handleTaskCreate = async (groupId: string, newTask: Partial<TaskWithFields>) => {
    try {
      const actualGroupId = groupId === 'ungrouped' ? null : groupId
      const position = tasks.filter(t => t.groupId === actualGroupId).length
      
      const task = await createTask(
        projectId!, 
        newTask.title || 'New Task', 
        actualGroupId, 
        position
      )
      
      const fullTask: TaskWithFields = {
        id: task.id,
        projectId: projectId!,
        title: task.title,
        assignee: null,
        status: task.status,
        groupId: task.group_id,
        dueAt: task.due_at,
        startAt: null,
        position: task.position,
        updatedAt: task.updated_at,
        fields: {}
      }
      
      setTasks(prev => [...prev, fullTask])
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleFieldUpdate = async (fieldId: string, updates: Partial<ProjectField>) => {
    // Optimistic update
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))

    try {
      await updateProjectField(fieldId, updates)
    } catch (error) {
      console.error('Failed to update field:', error)
      // Revert on error
      const f = await getProjectFields(projectId!)
      setFields(f)
    }
  }

  return (
    <main className="container mx-auto px-4 py-6 space-y-6 max-w-screen-2xl">
      {meta && <ProjectHeader meta={meta} />}
      
      {err && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive-foreground">
          {err}
        </div>
      )}
      
      {!err && (
        <ProjectTaskTable
          projectId={projectId!}
          tasks={tasks}
          fields={fields}
          groups={groups}
          onTaskUpdate={handleTaskUpdate}
          onTaskCreate={handleTaskCreate}
          onFieldUpdate={handleFieldUpdate}
        />
      )}
    </main>
  )
}
