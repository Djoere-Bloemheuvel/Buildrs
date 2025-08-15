
import type { InboxFilters, InboxItem, InboxType, Priority, ActionResult, PagedResult } from './types'

const MOCK_MODE = true

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

function mockItems(): InboxItem[] {
  const base: InboxItem[] = []
  const sources: InboxItem['source'][] = ['lead', 'sales', 'marketing', 'ops']
  const types: InboxType[] = ['needs_approval', 'workflow_issue']
  const now = Date.now()

  for (let i = 0; i < 120; i++) {
    const priority = (1 + (i % 5)) as Priority
    const mins = 5 + (i * 7) % 1000
    base.push({
      id: `inb_${i + 1}`,
      type: types[i % types.length],
      source: sources[i % sources.length],
      eventType: i % 2 ? 'sync' : 'approval',
      title: i % 2 ? `Workflow fout #${1000 + i}` : `Goedkeuring aanvraag #${2000 + i}`,
      description: 'Korte beschrijving (mock).',
      priority,
      status: 'new',
      suggestedDue: undefined,
      assignedToMe: i % 3 === 0,
      createdAt: new Date(now - mins * 60_000).toISOString(),
      ageMinutes: mins,
      context: { email: 'j***@bedrijf.com', id: `ctx_${i}`, details: { step: i % 4, note: 'Mock context' } },
    })
  }
  return base
}

export async function getInboxItems(params: Required<Pick<InboxFilters, 'page' | 'pageSize'>> & InboxFilters)
: Promise<PagedResult<InboxItem>> {
  if (MOCK_MODE) {
    const all = mockItems()
    let filtered = all
    if (params.type && params.type !== 'all') filtered = filtered.filter(i => i.type === params.type)
    if (params.priority && params.priority !== 'all') filtered = filtered.filter(i => i.priority === params.priority)
    if (params.source && params.source !== 'all') filtered = filtered.filter(i => i.source === params.source)
    if (params.mine) filtered = filtered.filter(i => i.assignedToMe === true)
    if (params.q) {
      const q = params.q.toLowerCase()
      filtered = filtered.filter(i => i.title.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q))
    }
    if (params.sort === 'priority') filtered = filtered.slice().sort((a, b) => b.priority - a.priority)
    else if (params.sort === 'age') filtered = filtered.slice().sort((a, b) => b.ageMinutes - a.ageMinutes)
    else if (params.sort === 'oldest') filtered = filtered.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    else filtered = filtered.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const total = filtered.length
    const start = clamp((params.page - 1) * params.pageSize, 0, Math.max(0, total - 1))
    const end = clamp(start + params.pageSize, 0, total)
    return { items: filtered.slice(start, end), total, page: params.page, pageSize: params.pageSize }
  }

  const qs = new URLSearchParams()
  if (params.type && params.type !== 'all') qs.set('type', params.type)
  if (params.priority && params.priority !== 'all') qs.set('priority', String(params.priority))
  if (params.source && params.source !== 'all') qs.set('source', params.source)
  if (params.mine) qs.set('mine', 'true')
  if (params.q) qs.set('q', params.q)
  if (params.sort) qs.set('sort', params.sort)
  qs.set('page', String(params.page))
  qs.set('pageSize', String(params.pageSize))
  // TODO: add next: { revalidate: 30 }
  const res = await fetch(`/api/inbox?${qs.toString()}`)
  if (!res.ok) throw new Error('Kon inbox-items niet laden')
  return res.json()
}

export async function getInboxItemById(id: string): Promise<InboxItem | null> {
  if (MOCK_MODE) return mockItems().find(x => x.id === id) ?? null
  // TODO: add next: { revalidate: 30 }
  const res = await fetch(`/api/inbox/${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error('Kon inbox-item niet laden')
  return res.json()
}

export async function simulateAction(name: string, id: string): Promise<ActionResult> {
  await new Promise(r => setTimeout(r, 600))
  return { ok: true, message: `${name} uitgevoerd (mock) voor ${id}` }
}

