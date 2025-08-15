
export function NextBestActions() {
  const list: any[] = [];
  
  if (list.length === 0) {
    return <p className="text-muted-foreground">Geen suggesties beschikbaar.</p>;
  }
  
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {list.slice(0, 3).map(x => (
        <div key={x.id} className="rounded-xl border border-border/40 bg-background/40 p-4">
          <div className="font-medium">{x.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{x.summary}</p>
          <div className="mt-2 text-xs text-primary/80">{x.impact}</div>
          <div className="mt-3">
            <button className="text-xs text-primary underline" aria-label="Bekijk suggestie">Bekijk suggestie</button>
          </div>
        </div>
      ))}
    </div>
  );
}
