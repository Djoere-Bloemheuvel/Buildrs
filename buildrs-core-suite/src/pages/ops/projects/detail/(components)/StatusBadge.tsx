
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  onClick?: () => void
  className?: string
}

const statusStyles = {
  'todo': 'bg-gray-100 text-gray-800 border-gray-300',
  'in_progress': 'bg-blue-100 text-blue-800 border-blue-300',
  'done': 'bg-green-100 text-green-800 border-green-300',
  'stuck': 'bg-red-100 text-red-800 border-red-300',
  'working_on_it': 'bg-orange-100 text-orange-800 border-orange-300',
} as const

const statusLabels = {
  'todo': 'To Do',
  'in_progress': 'In Progress', 
  'done': 'Done',
  'stuck': 'Stuck',
  'working_on_it': 'Working on it',
} as const

export function StatusBadge({ status, onClick, className }: StatusBadgeProps) {
  const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.todo
  const label = statusLabels[status as keyof typeof statusLabels] || status

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80",
        style,
        className
      )}
      onClick={onClick}
    >
      {label}
    </span>
  )
}
