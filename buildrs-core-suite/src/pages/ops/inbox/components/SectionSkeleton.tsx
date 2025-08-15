
import { Skeleton } from '@/components/ui/skeleton'

export function ToolbarSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/40">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 text-xs text-muted-foreground bg-background">
            <tr className="border-b border-border/40">
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Titel</th>
              <th className="px-3 py-2 text-left">Bron</th>
              <th className="px-3 py-2 text-left">Prioriteit</th>
              <th className="px-3 py-2 text-left">Leeftijd</th>
              <th className="px-3 py-2 text-left">Acties</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-border/20">
                <td className="px-3 py-3"><Skeleton className="h-5 w-24 rounded-full" /></td>
                <td className="px-3 py-3"><Skeleton className="h-4 w-48" /></td>
                <td className="px-3 py-3"><Skeleton className="h-4 w-16" /></td>
                <td className="px-3 py-3"><Skeleton className="h-4 w-10" /></td>
                <td className="px-3 py-3"><Skeleton className="h-4 w-14" /></td>
                <td className="px-3 py-3"><Skeleton className="h-6 w-28" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

