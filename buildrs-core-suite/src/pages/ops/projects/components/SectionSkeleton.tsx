import { Skeleton } from '@/components/ui/skeleton'

export function ToolbarSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-72" />
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
              {['Naam','Status','Gezondheid','Deadline','Eigenaar','Open taken','Overdue','Laatste update'].map(h => (
                <th key={h} className="px-3 py-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-border/20">
                {Array.from({ length: 8 }).map((__, j) => (
                  <td key={j} className="px-3 py-3"><Skeleton className="h-4 w-32" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

