'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { simulateAction } from '../lib/fetchers';
import { useNavigate } from 'react-router-dom';

export function InboxRowActions({ id, kind }: { id: string; kind: 'needs_approval' | 'workflow_issue' }) {
  const [busy, setBusy] = useState<string | null>(null);
  const nav = useNavigate();

  async function run(name: string) {
    setBusy(name);
    // TODO: call POST /api/inbox/:id/<action>
    await simulateAction(name, id);
    setBusy(null);
    nav(0);
  }

  return (
    <div className="flex items-center gap-2">
      {kind === 'needs_approval' ? (
        <>
          <Button size="sm" onClick={() => run('accept')} disabled={!!busy} aria-label="Accepteren">{busy === 'accept' ? '…' : 'Accepteren'}</Button>
          <Button size="sm" variant="outline" onClick={() => run('delegate')} disabled={!!busy} aria-label="Toewijzen">{busy === 'delegate' ? '…' : 'Toewijzen'}</Button>
          <Button size="sm" variant="outline" onClick={() => run('snooze')} disabled={!!busy} aria-label="Snoozen">{busy === 'snooze' ? '…' : 'Snoozen'}</Button>
          <Button size="sm" variant="destructive" onClick={() => run('reject')} disabled={!!busy} aria-label="Afwijzen">{busy === 'reject' ? '…' : 'Afwijzen'}</Button>
        </>
      ) : (
        <>
          <Button size="sm" variant="outline" onClick={() => run('fix')} disabled={!!busy} aria-label="Fixen">{busy === 'fix' ? '…' : 'Fixen'}</Button>
          <Button size="sm" onClick={() => run('retry')} disabled={!!busy} aria-label="Opnieuw proberen">{busy === 'retry' ? '…' : 'Opnieuw proberen'}</Button>
        </>
      )}
    </div>
  );
}

