'use client';

import { useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { simulateAction } from '../lib/fetchers';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: {
    id: string;
    type: 'needs_approval' | 'workflow_issue';
    title: string;
    priority: number;
    source: string;
    eventType: string;
    createdAtReadable: string;
    ageReadable: string;
    context: Record<string, unknown>;
  } | null;
  actions: React.ReactNode;
};

export function InboxDrawer({ open, onOpenChange, item, actions }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!item) return;
      if (e.key === 'a' && item.type === 'needs_approval') e.preventDefault();
      if (e.key === 'r' && item.type === 'workflow_issue') e.preventDefault();
      if (e.key === 's') e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {item?.title ?? '—'}
            {item && <Badge variant="secondary" className="capitalize">{item.type.replace('_', ' ')}</Badge>}
            {item && <Badge>{`P${item.priority}`}</Badge>}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {item ? (
              <>Bron: <b>{item.source}</b> · Event: <b>{item.eventType}</b> · Aangemaakt: <b>{item.createdAtReadable}</b> · Leeftijd: <b>{item.ageReadable}</b></>
            ) : '—'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-medium">Context</h3>
          <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-xs">
            {item ? (
              <dl className="grid grid-cols-2 gap-2">
                {Object.entries(item.context).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="truncate">{String(typeof v === 'object' ? JSON.stringify(v) : v)}</dd>
                  </div>
                ))}
              </dl>
            ) : '—'}
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-medium mb-2">Acties</h3>
            {item?.type === 'needs_approval' ? (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={async () => { const r = await simulateAction('accept', item!.id); toast.success(r.message) }}>Accepteren</Button>
                <Button size="sm" variant="outline" onClick={async () => { const r = await simulateAction('delegate', item!.id); toast.success(r.message) }}>Toewijzen</Button>
                <Button size="sm" variant="outline" onClick={async () => { const r = await simulateAction('snooze', item!.id); toast.success(r.message) }}>Snoozen</Button>
                <Button size="sm" variant="destructive" onClick={async () => { const r = await simulateAction('reject', item!.id); toast.success(r.message) }}>Afwijzen</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={async () => { const r = await simulateAction('fix', item!.id); toast.success(r.message) }}>Fixen</Button>
                <Button size="sm" onClick={async () => { const r = await simulateAction('retry', item!.id); toast.success(r.message) }}>Opnieuw proberen</Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

