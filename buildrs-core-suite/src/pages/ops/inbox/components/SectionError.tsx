'use client'

import { Button } from '@/components/ui/button'

export function SectionError({ message = 'Er ging iets mis.' }: { message?: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
      <div className="mb-2 font-medium">Fout</div>
      <p className="mb-3 text-destructive-foreground/90">{message}</p>
      <Button variant="outline" onClick={() => window.location.reload()} aria-label="Opnieuw laden">
        Opnieuw laden
      </Button>
    </div>
  )
}

