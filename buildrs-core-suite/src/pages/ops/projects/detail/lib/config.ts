import type { ProjectField } from './types'

export type ColumnType = 'status'|'person'|'date'|'text'|'long_text'|'number'|'label'|'priority'|'checkbox'|'link'

export interface ColumnConfig {
  id: string
  key: string
  label: string
  type: ColumnType
  visible: boolean
  width?: number
  required?: boolean
  multi?: boolean
  options?: string[]
  colors?: Record<string, string>
  default?: any
}

export interface ProjectViewConfig {
  columns: ColumnConfig[]
  density: 'compact'|'comfortable'
  ordering?: 'position'|'due_date'|'priority'|'updated_at'
}

export function buildDefaultConfig(fields: ProjectField[]): ProjectViewConfig {
  const builtin: ColumnConfig[] = [
    { id: 'builtin:title', key: 'title', label: 'Titel', type: 'text', visible: true },
    { id: 'builtin:status', key: 'status', label: 'Status', type: 'status', visible: true },
    { id: 'builtin:assignee', key: 'assignee', label: 'Toegewezen', type: 'person', visible: true },
    { id: 'builtin:group', key: 'group', label: 'Groep', type: 'label', visible: true },
    { id: 'builtin:due_date', key: 'due_date', label: 'Deadline', type: 'date', visible: true },
    { id: 'builtin:priority', key: 'priority', label: 'Prioriteit', type: 'priority', visible: false },
  ]
  const customs: ColumnConfig[] = fields
    .filter(f => !f.archived)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(f => ({
      id: `field:${f.id}`,
      key: f.key,
      label: f.label,
      type: mapFieldTypeToColumnType(f.type),
      visible: true,
    }))
  return { columns: [...builtin, ...customs], density: 'comfortable', ordering: 'position' }
}

function mapFieldTypeToColumnType(t: string): ColumnType {
  switch (t) {
    case 'text': return 'text'
    case 'richtext': return 'long_text'
    case 'number': return 'number'
    case 'date': return 'date'
    case 'datetime': return 'date'
    case 'multiselect': return 'label'
    case 'user': return 'person'
    case 'boolean': return 'checkbox'
    case 'priority': return 'priority'
    case 'status': return 'status'
    case 'url': return 'link'
    default: return 'text'
  }
}

