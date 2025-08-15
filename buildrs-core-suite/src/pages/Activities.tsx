
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchActivities } from '@/data/crm'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default function ActivitiesPage() {
  const [search, setSearch] = useState('')
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities', search],
    queryFn: () => fetchActivities(search),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
  return (
    <div className="space-y-6">
      <div className="glass-surface p-6">
        <h1 className="text-2xl font-semibold">Activiteiten</h1>
        <p className="text-muted-foreground">Alle recente events</p>
      </div>

      <div className="glass-surface p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Zoek activiteiten..." className="pl-10 bg-transparent" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({length:8}).map((_,i)=> (<div key={i} className="glass-surface h-16 animate-pulse" />))}
        </div>
      ) : error ? (
        <div className="glass-surface p-6">Fout bij laden</div>
      ) : (
        <div className="space-y-2">
          {activities?.map((a)=>(
            <div key={a.id} className="glass-surface-hover p-4 flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center"><Clock className="w-4 h-4 text-white" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{a.action}</div>
                <div className="text-sm text-muted-foreground truncate">{a.description ?? '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
