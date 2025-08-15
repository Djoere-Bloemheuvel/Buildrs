import { Button } from '@/components/ui/button'

export function EmptyState() {
  function resetFilters() { window.location.href = '/ops/projects' }
  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-8 text-center">
      <div className="text-lg font-medium">Geen projecten gevonden.</div>
      <p className="text-sm text-muted-foreground mt-1">Pas de filters aan of reset om opnieuw te proberen.</p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button variant="outline" onClick={resetFilters}>Filters resetten</Button>
        <a className="text-sm text-primary underline" href="#">Nieuw project</a>
      </div>
    </div>
  )
}

