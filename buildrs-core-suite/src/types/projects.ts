export type ProjectStatus = 'active' | 'archived'
export type ProjectPriority = 'low' | 'normal' | 'high' | 'critical'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical'

export interface Project {
  id: string
  client_id: string
  key: string | null
  name: string
  description: string | null
  status: ProjectStatus
  priority: ProjectPriority
  owner_id: string | null
  pinned: boolean
  labels: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProjectTask {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  points: number | null
  due_date: string | null
  position: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TaskWithMeta extends ProjectTask {
  assignees: { user_id: string; name?: string; avatar_url?: string }[]
  comments_count: number
  checklist_done: number
  checklist_total: number
  attachments_count: number
  labels: string[]
}

