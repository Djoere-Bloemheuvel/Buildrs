export type InboxType = 'needs_approval' | 'workflow_issue'
export type Priority = 1 | 2 | 3 | 4 | 5
export type Status = 'new' | 'accepted' | 'rejected' | 'snoozed' | 'resolved'

export interface InboxItem {
  id: string
  type: InboxType
  source: 'lead' | 'sales' | 'marketing' | 'ops'
  eventType: string
  title: string
  description?: string
  priority: Priority
  status: Status
  createdAt: string // ISO
  ageMinutes: number
  suggestedDue?: string // ISO
  assignedToMe?: boolean
  context: Record<string, unknown>
}

export interface InboxFilters {
  q?: string
  type?: InboxType | 'all'
  priority?: Priority | 'all'
  source?: InboxItem['source'] | 'all'
  mine?: boolean
  sort?: 'newest' | 'oldest' | 'priority' | 'age'
  page?: number
  pageSize?: number
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface ActionResult {
  ok: boolean
  message: string
}

