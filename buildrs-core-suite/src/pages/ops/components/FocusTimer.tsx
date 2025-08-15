'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TaskOption = { id: string; label: string };

export default function FocusTimer({ tasks }: { tasks: TaskOption[] }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="space-y-3" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="text-3xl font-semibold tabular-nums" aria-label="Tijd">{mm}:{ss}</div>
        <span className="text-xs text-muted-foreground">{running ? 'Bezig' : 'Gepauzeerd'}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => setRunning(true)} aria-label="Start">Start</Button>
        <Button variant="outline" onClick={() => setRunning(false)} aria-label="Pauze">Pauze</Button>
        <Button variant="outline" onClick={() => { setRunning(false); setSeconds(0); }} aria-label="Reset">Reset</Button>
      </div>

      <div className="pt-1">
        <label className="mb-1 block text-xs text-muted-foreground">Koppel aan taak (optioneel)</label>
        <Select value={taskId} onValueChange={setTaskId}>
          <SelectTrigger aria-label="Kies taak">
            <SelectValue placeholder="Geen taak gekoppeld" />
          </SelectTrigger>
          <SelectContent>
            {tasks.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

