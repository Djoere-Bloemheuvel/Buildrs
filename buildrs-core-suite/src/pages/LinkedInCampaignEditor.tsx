import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import PropositionSelect from '@/components/lead/PropositionSelect'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Play, PauseCircle, StopCircle } from 'lucide-react'

export default function LinkedInCampaignEditor() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data, isLoading, error } = useQuery({
    queryKey: ['linkedin-campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!campaignId,
    staleTime: 10_000,
  })

  const [local, setLocal] = useState<any>(null)
  useEffect(() => { if (data) setLocal(data) }, [data])

  const dirty = useMemo(() => {
    if (!data || !local) return false
    return JSON.stringify(local) !== JSON.stringify(data)
  }, [local, data])

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<any>) => {
      const { data: upd, error } = await supabase
        .from('campaigns')
        .update(payload)
        .eq('id', campaignId)
        .select('*')
        .single()
      if (error) throw error
      return upd
    },
    onSuccess: (upd) => {
      setLocal(upd)
      toast({ title: 'Opgeslagen' })
    },
    onError: (e: any) => toast({ title: 'Opslaan mislukt', description: e?.message ?? 'Onbekende fout' })
  })

  const setField = (k: string, v: any) => setLocal((prev: any) => ({ ...(prev || {}), [k]: v }))

  if (isLoading) return <div className="p-4">Laden…</div>
  if (error || !data) return <div className="p-4 text-destructive">Fout bij laden van campagne</div>

  const status = local?.status || 'draft'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" />Terug</Button>
          <h1 className="text-xl font-semibold truncate">{local?.name || 'Campagne'}</h1>
          <span className="text-sm text-muted-foreground capitalize ml-2">({status})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ status: 'active' })}><Play className="w-4 h-4 mr-2" />Start</Button>
          <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ status: 'paused' })}><PauseCircle className="w-4 h-4 mr-2" />Pauzeer</Button>
          <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ status: 'stopped' })}><StopCircle className="w-4 h-4 mr-2" />Stop</Button>
          <Button size="sm" disabled={!dirty} onClick={() => updateMutation.mutate(local)}><Save className="w-4 h-4 mr-2" />Opslaan</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Algemeen</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm">Naam</label>
            <Input value={local?.name || ''} onChange={e => setField('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Propositie</label>
            <PropositionSelect value={local?.proposition_id || null} onChange={(v) => setField('proposition_id', v)} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm">Omschrijving</label>
            <Textarea value={local?.description || ''} onChange={e => setField('description', e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Doelgroep (filters)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <label className="text-sm">Audience JSON (MVP)</label>
          <Textarea
            value={JSON.stringify(local?.audience_filter || {}, null, 2)}
            onChange={e => { try { setField('audience_filter', JSON.parse(e.target.value || '{}')) } catch {} }}
            rows={8}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Sequence (MVP)</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>Stappen: Connect → Wacht 2 dagen → Bericht 1 → Wacht 3 dagen → Bericht 2.</div>
          <div>Klik op Opslaan om je wijzigingen te bewaren. In de volgende iteratie maken we een drag‑and‑drop flowbuilder.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Verzendvenster & limieten</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm">Sending window JSON</label>
            <Textarea
              value={JSON.stringify(local?.sending_window || {}, null, 2)}
              onChange={e => { try { setField('sending_window', JSON.parse(e.target.value || '{}')) } catch {} }}
              rows={6}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Status</label>
            <Input readOnly value={String(local?.status || 'draft')} />
            <p className="text-xs text-muted-foreground">Gebruik Start/Pauzeer/Stop bovenin om de status te wijzigen.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

