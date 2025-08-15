type Variant = 'tasks' | 'agenda' | 'inbox' | 'timer' | 'next';

export function SectionSkeleton({ variant }: { variant: Variant }) {
  const rows = variant === 'timer' ? 1 : variant === 'next' ? 3 : 5;
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border border-border/40 bg-muted/20 p-3">
          <div className="h-4 w-2/3 rounded bg-muted/50" />
          <div className="mt-2 h-3 w-1/3 rounded bg-muted/40" />
        </div>
      ))}
    </div>
  );
}

