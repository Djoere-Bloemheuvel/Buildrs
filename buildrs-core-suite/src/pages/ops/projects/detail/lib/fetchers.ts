
import { supabase } from '@/integrations/supabase/client'
import type {
  Health,
  ProjectField,
  ProjectGroup,
  ProjectMember,
  ProjectMeta,
  ProjectView,
  TaskWithFields,
} from './types'

export async function getProjectMeta(projectId: string): Promise<ProjectMeta | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, client_id, name, status, due_date, updated_at')
    .eq('id', projectId)
    .single()
  if (error) return null
  const health: Health = 'good' // TODO: afleiden uit overdue/open tasks of stored column
  return {
    id: data.id,
    clientId: data.client_id,
    name: data.name,
    status: mapStatus(data.status),
    dueDate: data.due_date ?? undefined,
    updatedAt: data.updated_at,
    health,
  }
}

export async function getProjectFields(projectId: string): Promise<ProjectField[]> {
  const { data, error } = await supabase
    .from('project_fields')
    .select('id, project_id, key, label, type, options, is_required, archived, order_index')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true })

  if (error || !data) return []
  return data.map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    key: row.key,
    label: row.label,
    type: row.type,
    options: row.options,
    isRequired: row.is_required,
    archived: row.archived,
    orderIndex: row.order_index,
  }))
}

export async function getProjectGroups(projectId: string): Promise<ProjectGroup[]> {
  const { data, error } = await supabase
    .from('project_groups')
    .select('id, project_id, key, label, color, order_index')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true })

  if (error || !data) return []
  return data.map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    key: row.key,
    label: row.label,
    color: row.color,
    orderIndex: row.order_index,
  }))
}

export async function getProjectViews(projectId: string): Promise<ProjectView[]> {
  const { data, error } = await supabase
    .from('project_views')
    .select('id, name, type, is_default, config')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    isDefault: row.is_default,
    config: row.config || {},
  }))
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select('user_id, role, profiles:users!inner(id, full_name)') as any

  if (error || !data) return []
  return (data as any[]).map((row: any) => {
    const name: string = row.profiles?.full_name || 'Gebruiker'
    const initials = name
      .split(/\s+/)
      .map((p: string) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    return { id: row.user_id, name, initials, role: row.role }
  })
}

export interface TaskFilters { q?: string; status?: string; assigneeId?: string }

export async function getTasksWithFields(projectId: string, filters?: TaskFilters): Promise<TaskWithFields[]> {
  // Base tasks query
  let query: any = supabase
    .from('tasks')
    .select('id, project_id, title, status, group_id, due_at, position, updated_at, assigned_to')
    .eq('project_id', projectId)

  if (filters?.q && filters.q.trim()) {
    query = query.ilike('title', `%${filters.q.trim()}%`)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.assigneeId && filters.assigneeId !== 'all') {
    query = query.eq('assigned_to', filters.assigneeId)
  }

  query = query.order('position', { ascending: true })

  const { data: tasks, error } = await query
  if (error || !tasks) return []

  // Fetch field values for these tasks
  const taskIds = tasks.map((t: any) => t.id)
  if (taskIds.length === 0) return []

  const { data: values } = await supabase
    .from('project_field_values')
    .select('task_id, field_id, value, fields:project_fields!inner(id, key)')
    .in('task_id', taskIds) as any

  const valueMap = new Map<string, Record<string, any>>()
  ;(values || []).forEach((row: any) => {
    const key = row.fields?.key
    if (!key) return
    const existing = valueMap.get(row.task_id) || {}
    existing[key] = row.value
    valueMap.set(row.task_id, existing)
  })

  // Map to UI model
  return tasks.map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    assignee: row.assigned_to ? { id: row.assigned_to, name: '—', initials: '–' } : null,
    status: row.status,
    groupId: row.group_id,
    dueAt: row.due_at,
    startAt: null,
    position: row.position,
    updatedAt: row.updated_at,
    fields: valueMap.get(row.id) || {},
  }))
}

function mapStatus(status: string): any {
  // Map project status values to UI
  if (status === 'active') return 'active'
  if (status === 'archived') return 'archived'
  return 'active'
}
