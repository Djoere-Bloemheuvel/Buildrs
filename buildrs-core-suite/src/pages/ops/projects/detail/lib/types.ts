export type FieldType =
  | 'text' | 'richtext' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect'
  | 'user' | 'boolean' | 'duration' | 'money' | 'url' | 'priority' | 'status'
  | 'relation' | 'rollup' | 'formula'

export type ProjectStatus = 'active'|'on_hold'|'completed'|'archived'
export type Health = 'excellent'|'good'|'warn'|'risk'

export interface ProjectMeta {
  id: string
  name: string
  status: ProjectStatus
  health: Health
  dueDate?: string
  updatedAt: string
  clientId: string
}

export interface ProjectField {
  id: string
  projectId: string
  key: string
  label: string
  type: FieldType
  options?: Record<string, any> | null
  isRequired: boolean
  archived: boolean
  orderIndex: number
}

export interface ProjectGroup {
  id: string
  projectId: string
  key: string
  label: string
  color: string
  orderIndex: number
}

export interface TaskCore {
  id: string
  projectId: string
  title: string
  assignee?: { id: string; name: string; initials: string } | null
  status?: string | null
  groupId?: string | null
  dueAt?: string | null
  startAt?: string | null
  position: number
  updatedAt: string
}

export interface TaskWithFields extends TaskCore {
  fields: Record<string, any>
}

export interface ProjectView {
  id: string
  name: string
  type: 'table'|'board'|'calendar'
  isDefault: boolean
  config: {
    columns?: string[]
    filters?: Array<{ key: string; op: string; value: any }>
    sorts?: Array<{ key: string; dir: 'asc'|'desc' }>
    groupBy?: { key: 'group'|'status'|'field'; fieldKey?: string }
    calendar?: { startKey: string; endKey?: string }
  }
}

export interface ProjectMember { id: string; name: string; initials: string; role: 'owner'|'editor'|'viewer' }

