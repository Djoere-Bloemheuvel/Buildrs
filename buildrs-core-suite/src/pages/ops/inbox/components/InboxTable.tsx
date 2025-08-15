import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getInboxItems, simulateAction } from '../lib/fetchers'
import type { InboxItem, InboxFilters } from '../lib/types'
import { TableSkeleton } from './SectionSkeleton'
import { EmptyState } from './EmptyState'
import { InboxRow } from './InboxRow'
import { InboxDrawer } from './InboxDrawer'
import { useDensity } from './InboxToolbar'
import { registerInboxShortcuts } from '../lib/keyboard'
import { toast } from 'sonner'

export function InboxTable() {
  const [params] = useSearchParams()
  const { density } = useDensity()
  const [rows, setRows] = useState<InboxItem[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [drawerItem, setDrawerItem] = useState<InboxItem | null>(null)
  const [activeIdx, setActiveIdx] = useState<number>(0)

  const page = Number(params.get('page') ?? '1')
  const pageSize = Number(params.get('pageSize') ?? '25')
  const type = (params.get('type') ?? 'all') as InboxFilters['type']
  const priority = (params.get('priority') ?? 'all') as InboxFilters['priority']
  const source = (params.get('source') ?? 'all') as InboxFilters['source']
  const mine = params.get('mine') === '1'
  const q = params.get('q') ?? undefined
  const sort = (params.get('sort') ?? 'newest') as NonNullable<InboxFilters['sort']>

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setRows(null)
    getInboxItems({ page, pageSize, type, priority, source, mine, q, sort })
      .then(({ items, total }) => { if (active) { setRows(items); setTotal(total) } })
      .catch(e => { if (active) setError(e?.message || 'Kon inbox laden') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, pageSize, type, priority, source, mine, q, sort])

  useEffect(() => {
    const unsub = registerInboxShortcuts({
      onNext: () => setActiveIdx(i => Math.min((rows?.length ?? 1) - 1, i + 1)),
      onPrev: () => setActiveIdx(i => Math.max(0, i - 1)),
      onOpen: () => { const it = rows?.[activeIdx]; if (it) openRow(it) },
      onAccept: async () => {
        const it = rows?.[activeIdx]; if (!it) return; if (it.type !== 'needs_approval') return
        const res = await simulateAction('accept', it.id); toast.success(res.message)
      },
      onRetry: async () => {
        const it = rows?.[activeIdx]; if (!it) return; if (it.type !== 'workflow_issue') return
        const res = await simulateAction('retry', it.id); toast.success(res.message)
      },
      onSnooze: async () => {
        const it = rows?.[activeIdx]; if (!it) return
        const res = await simulateAction('snooze', it.id); toast.success(res.message)
      },
      onCloseDrawer: () => setOpenDrawer(false),
      isTypingInInput: () => {
        const el = document.activeElement as HTMLElement | null
        return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.getAttribute('contenteditable') === 'true')
      }
    })
    return () => unsub()
  }, [rows, activeIdx])

  function openRow(item: InboxItem) { setDrawerItem(item); setOpenDrawer(true) }

  if (loading) return <TableSkeleton />
  if (error) return <div className="p-4 text-destructive">{error}</div>
  if (!rows || rows.length === 0) return <EmptyState />

  return (
    <div className="rounded-2xl border border-border/40 bg-background/40">
      <div className="overflow-auto">
        <table role="table" className="w-full text-sm">
          <thead className="sticky top-0 text-xs text-muted-foreground bg-background">
            <tr className="border-b border-border/40">
              <th scope="col" className="px-3 py-2 text-left">Status</th>
              <th scope="col" className="px-3 py-2 text-left">Titel</th>
              <th scope="col" className="px-3 py-2 text-left">Bron</th>
              <th scope="col" className="px-3 py-2 text-left">Prioriteit</th>
              <th scope="col" className="px-3 py-2 text-left">Leeftijd</th>
              <th scope="col" className="px-3 py-2 text-left">Acties</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, idx) => (
              <InboxRow key={item.id} item={item} density={density} onOpen={openRow} />
            ))}
          </tbody>
        </table>
      </div>

      <InboxDrawer
        open={openDrawer}
        onOpenChange={setOpenDrawer}
        item={drawerItem && {
          id: drawerItem.id,
          type: drawerItem.type,
          title: drawerItem.title,
          priority: drawerItem.priority,
          source: drawerItem.source,
          eventType: drawerItem.eventType,
          createdAtReadable: new Date(drawerItem.createdAt).toLocaleString(),
          ageReadable: drawerItem.ageMinutes < 60 ? `${drawerItem.ageMinutes}m` : `${Math.floor(drawerItem.ageMinutes/60)}u${drawerItem.ageMinutes%60||''}`,
          context: drawerItem.context,
        }}
        actions={null}
      />
    </div>
  )
}
