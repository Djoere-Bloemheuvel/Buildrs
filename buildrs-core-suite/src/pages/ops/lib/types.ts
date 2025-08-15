export type Priority = 'Laag' | 'Normaal' | 'Hoog' | 'Kritiek';
export type TaskStatus = 'Open' | 'In behandeling' | 'Klaar';

export interface Task {
  id: string;
  title: string;
  project: string;
  priority: Priority;
  due: string;              // ISO
  dueReadable: string;      // bv. "Vandaag 16:00"
  assigneeName: string;
  status: TaskStatus;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;            // ISO
  end: string;              // ISO
  startReadable: string;
  endReadable: string;
  source: 'Google' | 'ICS' | 'Outlook' | 'Onbekend';
}

export interface InboxItem {
  id: string;
  title: string;
  source: 'Lead' | 'Sales' | 'Marketing' | 'Ops';
  priority: Priority;
  ageMinutes: number;
  ageReadable: string;      // bv. "32m"
}

export interface NextAction {
  id: string;
  title: string;
  summary: string;
  impact: string;           // bv. "Hoogste impact op korte termijn"
}

