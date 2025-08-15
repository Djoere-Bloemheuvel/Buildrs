
'use client';

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function SectionError({ message = 'Er ging iets mis.' }: { message?: string }) {
  const navigate = useNavigate();
  const refresh = () => {
    window.location.reload();
  };

  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
      <div className="mb-2 font-medium">Fout</div>
      <p className="mb-3 text-destructive-foreground/90">{message}</p>
      <Button variant="outline" onClick={refresh} aria-label="Opnieuw laden">
        Opnieuw laden
      </Button>
    </div>
  );
}
