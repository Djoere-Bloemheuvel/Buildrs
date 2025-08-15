
import { supabase } from '@/integrations/supabase/client'
import type { ProjectField } from './types'

export async function createTask(projectId: string, title: string, groupId: string | null, position: number) {
  // First get the current client_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (!profile?.client_id) {
    throw new Error('No client_id found')
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({ 
      client_id: profile.client_id,
      title, 
      group_id: groupId, 
      position, 
      status: 'todo'
    })
    .select('id, title, group_id, position, status, due_at, updated_at, client_id')
    .single()

  if (error) throw error
  return data
}

export async function updateTaskPositionAndGroup(taskId: string, groupId: string | null, position: number) {
  const { error } = await supabase
    .from('tasks')
    .update({ group_id: groupId, position })
    .eq('id', taskId)
  if (error) throw error
}

export async function updateTaskCore(
  taskId: string,
  updates: { title?: string; status?: string | null; groupId?: string | null; dueAt?: string | null }
) {
  const payload: any = {}
  if (updates.title !== undefined) payload.title = updates.title
  if (updates.status !== undefined) payload.status = updates.status
  if (updates.groupId !== undefined) payload.group_id = updates.groupId
  if (updates.dueAt !== undefined) payload.due_at = updates.dueAt
  if (Object.keys(payload).length === 0) return
  const { error } = await supabase.from('tasks').update(payload).eq('id', taskId)
  if (error) throw error
}

export async function upsertTaskFields(
  projectId: string,
  taskId: string,
  fieldValues: Record<string, any>,
  allFields: ProjectField[]
) {
  // Get current client_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (!profile?.client_id) {
    throw new Error('No client_id found')
  }

  const keyToFieldId = new Map(allFields.map(f => [f.key, f.id]))
  for (const [key, value] of Object.entries(fieldValues)) {
    const fieldId = keyToFieldId.get(key)
    if (!fieldId) continue
    const { data: existing } = await supabase
      .from('project_field_values')
      .select('id')
      .eq('task_id', taskId)
      .eq('field_id', fieldId)
      .maybeSingle()
    if (existing?.id) {
      await supabase
        .from('project_field_values')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('project_field_values')
        .insert({ 
          client_id: profile.client_id,
          project_id: projectId, 
          task_id: taskId, 
          field_id: fieldId, 
          value 
        })
    }
  }
}

export async function createProjectField(projectId: string, field: {
  key: string
  label: string
  type: string
  options?: any
  isRequired?: boolean
}) {
  // Get current client_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (!profile?.client_id) {
    throw new Error('No client_id found')
  }

  const { data, error } = await supabase
    .from('project_fields')
    .insert({
      client_id: profile.client_id,
      project_id: projectId,
      key: field.key,
      label: field.label,
      type: field.type,
      options: field.options,
      is_required: field.isRequired || false,
      order_index: 0
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProjectField(fieldId: string, updates: Partial<ProjectField>) {
  const payload: any = {}
  if (updates.label !== undefined) payload.label = updates.label
  if (updates.type !== undefined) payload.type = updates.type
  if (updates.options !== undefined) payload.options = updates.options
  if (updates.isRequired !== undefined) payload.is_required = updates.isRequired
  if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex
  if (updates.archived !== undefined) payload.archived = updates.archived

  const { error } = await supabase
    .from('project_fields')
    .update(payload)
    .eq('id', fieldId)

  if (error) throw error
}

export async function deleteProjectField(fieldId: string) {
  const { error } = await supabase
    .from('project_fields')
    .delete()
    .eq('id', fieldId)

  if (error) throw error
}

export async function createProjectGroup(projectId: string, group: {
  key: string
  label: string
  color: string
}) {
  // Get current client_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (!profile?.client_id) {
    throw new Error('No client_id found')
  }

  const { data, error } = await supabase
    .from('project_groups')
    .insert({
      client_id: profile.client_id,
      project_id: projectId,
      key: group.key,
      label: group.label,
      color: group.color,
      order_index: 0
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProjectGroup(groupId: string, updates: {
  label?: string
  color?: string
  orderIndex?: number
}) {
  const payload: any = {}
  if (updates.label !== undefined) payload.label = updates.label
  if (updates.color !== undefined) payload.color = updates.color
  if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex

  const { error } = await supabase
    .from('project_groups')
    .update(payload)
    .eq('id', groupId)

  if (error) throw error
}

export async function deleteProjectGroup(groupId: string) {
  const { error } = await supabase
    .from('project_groups')
    .delete()
    .eq('id', groupId)

  if (error) throw error
}
