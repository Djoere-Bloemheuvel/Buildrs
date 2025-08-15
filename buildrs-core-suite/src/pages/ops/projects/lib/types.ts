
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived'
export type Health = 'excellent' | 'good' | 'warn' | 'risk'

export interface Project {
  id: string
  name: string
  status: ProjectStatus
  owner: { id: string; initials: string; name: string }
  dueDate?: string
  health: Health
  openTasks: number
  overdueTasks: number
  favorite?: boolean
  updatedAt: string
}

export interface ProjectFilters {
  q?: string
  status?: ProjectStatus | 'all'
  priority?: 'low' | 'normal' | 'high' | 'critical' | 'all'
  ownerId?: string | 'all'
  health?: Health | 'all'
  due?: '7d' | '14d' | '30d' | 'all'
  sort?: 'updated' | 'due' | 'health' | 'name'
  pinned?: boolean
  page: number
  pageSize: number
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface ProjectStats {
  active: number
  onHold: number
  completed: number
  risk: number
}
