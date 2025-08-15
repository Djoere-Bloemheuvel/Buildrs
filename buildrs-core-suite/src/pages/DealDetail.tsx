import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Building2, User, ArrowLeft, Calendar, TrendingUp, DollarSign, Mail, Phone, StickyNote, CheckSquare } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { currencyFormatter } from '@/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchStagesByPipeline } from '@/data/crm'
import { useToast } from '@/hooks/use-toast'

type DealRow = {
  id: string
  title: string | null
  value: number | null
  status: string | null
  stage_id: string | null
  confidence: number | null
  company_id: string | null
  created_at: string | null
  companies: {
    id: string
    name: string | null
    website?: string | null
    industry_label?: string | null
    subindustry_label?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    company_size?: number | null
  } | null
}

export default function DealDetail() {
  const { dealId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: deal, isLoading: dealLoading, error: dealError } = useQuery<{ row: DealRow | null }>({
    queryKey: ['deal-detail', dealId, profile?.client_id],
    enabled: !!dealId,
    queryFn: async () => {
      let query = supabase
        .from('deals')
        .select(`
          id,
          title,
          value,
          status,
          stage_id,
          confidence,
          company_id,
          created_at,
          companies (
            id,
            name,
            website,
            industry_label,
            subindustry_label,
            city,
            state,
            country,
            company_size
          )
        `)
        .eq('id', dealId as string)
        .single()
      const { data, error } = await query
      if (error) throw error
      return { row: (data as unknown as DealRow) || null }
    },
    staleTime: 30_000,
  })

  const companyId = deal?.row?.companies?.id || deal?.row?.company_id || null

  const { data: stage } = useQuery<{ id: string, name: string, pipeline_id?: string, default_probability?: number } | null>({
    queryKey: ['deal-stage', deal?.row?.stage_id],
    enabled: !!deal?.row?.stage_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stages')
        .select('id,name,pipeline_id,default_probability')
        .eq('id', deal!.row!.stage_id as string)
        .single()
      if (error) return null
      return data as any
    },
  })

  const { data: pipelineStages } = useQuery<any[]>({
    queryKey: ['pipeline-stages', stage?.pipeline_id],
    enabled: !!stage?.pipeline_id,
    queryFn: async () => stage?.pipeline_id ? await fetchStagesByPipeline(stage.pipeline_id) : [],
    staleTime: 60_000,
  })

  const { data: contacts } = useQuery<any[]>({
    queryKey: ['company-contacts', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id,first_name,last_name,email,phone,job_title,function_group,status,created_at')
        .eq('company_id', companyId as string)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data || []
    },
    staleTime: 30_000,
  })

  const headerStats = useMemo(() => {
    const v = deal?.row?.value || 0
    const conf = deal?.row?.confidence || 0
    const weighted = Math.round(v * (conf / 100))
    return { v, conf, weighted }
  }, [deal])

  // Derived summary for right-rail card
  const dealSummary = useMemo(() => {
    const parts: string[] = []
    if (deal?.row?.title) parts.push(`Deal: ${deal.row.title}`)
    if (stage?.name) parts.push(`Fase: ${stage.name}`)
    if (typeof deal?.row?.value === 'number') parts.push(`Waarde: ${currencyFormatter(deal.row.value || 0, 'EUR')}`)
    if (deal?.row?.companies?.name) parts.push(`Account: ${deal.row.companies.name}`)
    if (contacts?.length) parts.push(`Contacten: ${contacts.length}`)
    return parts.join(' • ')
  }, [deal, stage, contacts])

  // Edit state
  const [editTitle, setEditTitle] = useState<string>('')
  const [editValue, setEditValue] = useState<string>('')
  const [editStatus, setEditStatus] = useState<string>('open')
  const [editStageId, setEditStageId] = useState<string>('')
  const [editConfidence, setEditConfidence] = useState<string>('')

  useEffect(() => {
    if (deal?.row) {
      setEditTitle(deal.row.title || '')
      setEditValue(typeof deal.row.value === 'number' ? String(deal.row.value) : '')
      setEditStatus(deal.row.status || 'open')
      setEditStageId(deal.row.stage_id || '')
      setEditConfidence(typeof deal.row.confidence === 'number' ? String(deal.row.confidence) : '')
    }
  }, [deal])

  // If stage changes, optionally update confidence to default of selected stage
  useEffect(() => {
    if (!pipelineStages || !editStageId) return
    const s = pipelineStages.find((st: any) => st.id === editStageId)
    if (s && typeof s.default_probability === 'number') {
      setEditConfidence(String(s.default_probability))
    }
  }, [editStageId])

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: editTitle || null,
        value: editValue !== '' ? Number(editValue) : null,
        status: editStatus || null,
        stage_id: editStageId || null,
        confidence: editConfidence !== '' ? Number(editConfidence) : null,
      }
      const { data, error } = await supabase
        .from('deals')
        .update(payload)
        .eq('id', dealId as string)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({ title: 'Deal opgeslagen' })
      qc.invalidateQueries({ queryKey: ['deal-detail', dealId, profile?.client_id] })
      qc.invalidateQueries({ queryKey: ['deals'] })
    },
    onError: (err: any) => {
      toast({ title: 'Opslaan mislukt', description: err?.message || 'Onbekende fout', variant: 'destructive' })
    }
  })

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="h-10 px-3">
          <ArrowLeft className="w-4 h-4 mr-2" /> Terug
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold">{deal?.row?.title || 'Deal'}</h1>
              <div className="flex items-center gap-2 text-blue-100">
                <Building2 className="w-4 h-4" />
                {deal?.row?.companies?.name ? (
                  <Link to={`/accounts/${companyId}`} className="hover:underline text-white">
                    {deal.row.companies.name}
                  </Link>
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <div className="text-blue-100">Waarde</div>
                <div className="font-semibold flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> {currencyFormatter(headerStats.v, 'EUR')}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-blue-100">Confidence</div>
                <div className="font-semibold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> {headerStats.conf}%
                </div>
              </div>
              <div className="text-sm">
                <div className="text-blue-100">Gewogen</div>
                <div className="font-semibold">{currencyFormatter(headerStats.weighted, 'EUR')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {dealLoading ? (
            <div className="text-muted-foreground">Laden…</div>
          ) : dealError ? (
            <div className="text-destructive">Kon deal niet laden.</div>
          ) : !deal?.row ? (
            <div className="text-muted-foreground">Deal niet gevonden.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Tabs defaultValue="overzicht" className="flex flex-col">
              <TabsList className="w-full grid grid-cols-3 md:w-auto md:inline-grid md:grid-cols-3">
                <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
                <TabsTrigger value="contacten">Contacten</TabsTrigger>
                <TabsTrigger value="bedrijf">Bedrijf</TabsTrigger>
              </TabsList>

                  <TabsContent value="overzicht" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg">
                        <CardContent className="p-6 space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Titel</Label>
                            <Input value={editTitle} onChange={(e)=> setEditTitle(e.target.value)} placeholder="Deal titel" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Waarde (EUR)</Label>
                              <Input type="number" inputMode="numeric" value={editValue} onChange={(e)=> setEditValue(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Confidence (%)</Label>
                              <Input type="number" inputMode="numeric" value={editConfidence} onChange={(e)=> setEditConfidence(e.target.value)} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Status</Label>
                              <Select value={editStatus} onValueChange={setEditStatus}>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Kies status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="running">Running</SelectItem>
                                  <SelectItem value="paused">Paused</SelectItem>
                                  <SelectItem value="stopped">Stopped</SelectItem>
                                  <SelectItem value="won">Won</SelectItem>
                                  <SelectItem value="lost">Lost</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Fase</Label>
                              <Select value={editStageId} onValueChange={setEditStageId}>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Kies fase" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(pipelineStages || []).map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="pt-2">
                            <Button onClick={()=> updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                              {updateMutation.isPending ? 'Opslaan…' : 'Wijzigingen opslaan'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg md:col-span-2">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Calendar className="w-4 h-4" /> Laatste activiteiten (coming soon)
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/40">
                                <div className="text-sm font-medium">Activiteit {i + 1}</div>
                                <div className="text-xs text-muted-foreground">Binnenkort beschikbaar</div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

              <TabsContent value="contacten" className="pt-4">
                <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg">
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[60vh]">
                      <div className="p-6 space-y-3">
                        {!contacts?.length ? (
                          <div className="text-muted-foreground text-sm">Geen contacten gevonden.</div>
                        ) : (
                          contacts.map((c) => (
                            <div key={c.id} className="flex items-center justify-between border-b border-border/40 pb-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{(c.first_name || '') + ' ' + (c.last_name || '')}</div>
                                  <div className="text-xs text-muted-foreground truncate">{c.job_title || c.function_group || '—'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="hidden md:block text-muted-foreground truncate max-w-[220px]">{c.email || '—'}</div>
                                <Button variant="outline" size="sm" className="h-8">
                                  <Mail className="w-4 h-4 mr-2" /> E-mail
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bedrijf" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg">
                    <CardContent className="p-6 space-y-2">
                      <div className="text-sm text-muted-foreground">Bedrijf</div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <Link to={`/accounts/${companyId}`} className="font-medium hover:underline">
                          {deal.row.companies?.name || '—'}
                        </Link>
                      </div>
                      <div className="text-sm text-muted-foreground mt-3">Industrie</div>
                      <div className="font-medium">{deal.row.companies?.industry_label || '—'}</div>
                      {deal.row.companies?.subindustry_label && (
                        <Badge variant="secondary" className="w-fit mt-1">{deal.row.companies?.subindustry_label}</Badge>
                      )}
                      <div className="text-sm text-muted-foreground mt-3">Locatie</div>
                      <div className="font-medium">{deal.row.companies?.city || deal.row.companies?.state || deal.row.companies?.country || '—'}</div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg">
                    <CardContent className="p-6 space-y-2">
                      <div className="text-sm text-muted-foreground">Bedrijfsgrootte</div>
                      <div className="font-medium">{typeof deal.row.companies?.company_size === 'number' ? deal.row.companies?.company_size.toLocaleString() : '—'}</div>
                      <div className="text-sm text-muted-foreground mt-3">Website</div>
                      {deal.row.companies?.website ? (
                        <a href={deal.row.companies.website} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                          {deal.row.companies.website}
                        </a>
                      ) : (
                        <div className="font-medium">—</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
                </Tabs>
              </div>

              <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
                <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg">
                  <CardContent className="p-6 space-y-4">
                    <div className="text-sm font-medium">Snelle acties</div>
                    <div className="grid grid-cols-5 gap-3">
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" disabled>
                        <StickyNote className="w-4 h-4" />
                      </Button>
                      <Button asChild variant="outline" size="icon" className="h-10 w-10 rounded-xl" disabled={!contacts?.[0]?.email}>
                        <a href={contacts?.[0]?.email ? `mailto:${contacts?.[0]?.email}` : undefined}>
                          <Mail className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="icon" className="h-10 w-10 rounded-xl" disabled={!contacts?.[0]?.phone}>
                        <a href={contacts?.[0]?.phone ? `tel:${contacts?.[0]?.phone}` : undefined}>
                          <Phone className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" disabled>
                        <CheckSquare className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" disabled>
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg">
                  <CardContent className="p-6 space-y-2">
                    <div className="text-sm font-medium mb-1">Deal samenvatting</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{dealSummary || '—'}</div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg">
                  <CardContent className="p-6 space-y-3">
                    <div className="text-sm font-medium">Associaties</div>
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Contacten</div>
                      {contacts?.slice(0,3).map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div className="truncate">{(c.first_name || '') + ' ' + (c.last_name || '')}</div>
                          </div>
                          <a className="text-xs text-primary hover:underline" href={c.email ? `mailto:${c.email}` : undefined} onClick={e => { if (!c.email) e.preventDefault() }}>E-mail</a>
                        </div>
                      ))}
                      {!contacts?.length && <div className="text-xs text-muted-foreground">Geen contacten</div>}
                    </div>
                    <div className="pt-2">
                      <div className="text-xs text-muted-foreground">Bedrijf</div>
                      <div>
                        <Link to={`/accounts/${companyId}`} className="text-sm font-medium hover:underline">{deal.row.companies?.name || '—'}</Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

