
import type { Task, CalendarEvent, InboxItem, NextAction, Priority } from './types';

const MOCK_MODE = true;

export async function getTasksToday(): Promise<{ today: Task[]; overdue: Task[] }> {
  if (MOCK_MODE) {
    const mockTasks: Task[] = [
      {
        id: 'task_1',
        title: 'Review Q4 budget proposal',
        project: 'Finance',
        priority: 'Hoog',
        due: new Date().toISOString(),
        dueReadable: 'Vandaag 16:00',
        assigneeName: 'Jan de Vries',
        status: 'Open'
      },
      {
        id: 'task_2', 
        title: 'Update CRM database',
        project: 'Sales',
        priority: 'Normaal',
        due: new Date(Date.now() - 86400000).toISOString(),
        dueReadable: 'Gisteren 14:00',
        assigneeName: 'Marie Jansen',
        status: 'In behandeling'
      }
    ];
    return { today: mockTasks.slice(0, 1), overdue: mockTasks.slice(1) };
  }
  
  const res = await fetch('/api/tasks/today');
  if (!res.ok) throw new Error('Kon taken niet laden');
  return res.json();
}

export async function getCalendar48h(): Promise<CalendarEvent[]> {
  if (MOCK_MODE) {
    const now = new Date();
    return [
      {
        id: 'evt_1',
        title: 'Weekly standup',
        start: new Date(now.getTime() + 3600000).toISOString(),
        end: new Date(now.getTime() + 5400000).toISOString(),
        startReadable: 'Vandaag 14:00',
        endReadable: 'Vandaag 14:30',
        source: 'Google'
      },
      {
        id: 'evt_2',
        title: 'Client review meeting',
        start: new Date(now.getTime() + 86400000).toISOString(),
        end: new Date(now.getTime() + 90000000).toISOString(),
        startReadable: 'Morgen 10:00',
        endReadable: 'Morgen 11:00',
        source: 'Outlook'
      }
    ];
  }
  
  const res = await fetch('/api/calendar/48h');
  if (!res.ok) throw new Error('Kon agenda niet laden');
  return res.json();
}

export async function getInboxPreview(limit: number): Promise<InboxItem[]> {
  if (MOCK_MODE) {
    const mockItems: InboxItem[] = [
      {
        id: 'inbox_1',
        title: 'Nieuwe lead van website',
        source: 'Marketing',
        priority: 'Hoog',
        ageMinutes: 25,
        ageReadable: '25m'
      },
      {
        id: 'inbox_2',
        title: 'Offerte feedback ontvangen',
        source: 'Sales',
        priority: 'Normaal',
        ageMinutes: 65,
        ageReadable: '1u5m'
      }
    ];
    return mockItems.slice(0, limit);
  }
  
  const res = await fetch(`/api/inbox/preview?limit=${limit}`);
  if (!res.ok) throw new Error('Kon inbox preview niet laden');
  return res.json();
}

export async function getNextActions(): Promise<NextAction[]> {
  if (MOCK_MODE) {
    return [
      {
        id: 'action_1',
        title: 'Follow up met prospect XYZ',
        summary: 'Laatste contact was 2 weken geleden, tijd voor follow-up',
        impact: 'Hoogste impact op korte termijn'
      },
      {
        id: 'action_2',
        title: 'Update pricing voor Q1',
        summary: 'Concurrentieanalyse is klaar, pricing kan worden bijgewerkt',
        impact: 'Medium impact op middellange termijn'
      },
      {
        id: 'action_3',
        title: 'Optimize onboarding flow',
        summary: 'Data toont bottleneck bij stap 3 van onboarding',
        impact: 'Hoge impact op customer success'
      }
    ];
  }
  
  const res = await fetch('/api/next-actions');
  if (!res.ok) throw new Error('Kon next actions niet laden');
  return res.json();
}
