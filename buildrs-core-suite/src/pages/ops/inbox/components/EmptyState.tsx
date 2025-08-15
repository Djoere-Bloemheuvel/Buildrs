export function EmptyState() {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-8 text-center">
      <div className="text-lg font-medium">Geen inbox-items gevonden.</div>
      <p className="text-sm text-muted-foreground mt-1">Pas de filters aan of reset om opnieuw te proberen.</p>
    </div>
  )
}

