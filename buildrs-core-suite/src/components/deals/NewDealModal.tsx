
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { createDeal, fetchCompanies, fetchContacts, fetchStagesByPipeline } from '@/data/crm'
import { Building2, Contact, Euro, Percent, Target, FileText, Sparkles } from 'lucide-react'

type Pipeline = { id: string; name: string }

export default function NewDealModal({
  open,
  onOpenChange,
  pipelines,
  activePipeline,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  pipelines: Pipeline[]
  activePipeline: string | null
  onCreated: (pipelineId?: string) => void
}) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()

  const [draft, setDraft] = useState<{
    title: string
    company_id?: string
    contact_id?: string
    value?: number
    currency: string
    confidence?: number
    pipeline_id?: string
    stage_id?: string
    description?: string
  }>({ title: '', currency: 'EUR', confidence: 50 })

  // Debug logging voor auth status
  useEffect(() => {
    if (open) {
      console.log('Modal opened, auth status:', {
        user: !!profile,
        userId: profile?.id,
        clientId: profile?.client_id,
        role: profile?.role
      });
    }
  }, [open, profile])

  // Prefill when modal opens
  useEffect(() => {
    if (open) {
      setDraft({
        title: '',
        currency: 'EUR',
        confidence: 50,
        pipeline_id: activePipeline || pipelines?.[0]?.id,
        stage_id: undefined,
        company_id: undefined,
        contact_id: undefined,
        description: '',
      })
    }
  }, [open, activePipeline, pipelines])

  // Stages for selected pipeline
  const { data: stages = [] } = useQuery({
    queryKey: ['stages', draft.pipeline_id],
    queryFn: () => (draft.pipeline_id ? fetchStagesByPipeline(draft.pipeline_id) : Promise.resolve([])),
    enabled: open && !!draft.pipeline_id,
    staleTime: 60_000,
  })

  // Auto-select first stage when available
  useEffect(() => {
    if (open && draft.pipeline_id && stages.length && !draft.stage_id) {
      setDraft(prev => ({ ...prev, stage_id: stages[0].id }))
    }
  }, [open, draft.pipeline_id, stages, draft.stage_id])

  // Companies & contacts
  const { data: companies = [] } = useQuery({
    queryKey: ['companies-for-modal'],
    queryFn: () => fetchCompanies(),
    enabled: open,
    staleTime: 60_000,
  })

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-modal'],
    queryFn: () => fetchContacts(),
    enabled: open,
    staleTime: 60_000,
  })

  const availableContacts = useMemo(() => {
    if (!draft.company_id) return contacts
    return (contacts || []).filter((c: any) => c.company_id === draft.company_id)
  }, [contacts, draft.company_id])

  const createMutation = useMutation({
    mutationFn: createDeal,
    onSuccess: (row: any) => {
      console.log('Deal successfully created:', row)
      toast({ title: 'Deal succesvol aangemaakt!' })
      onOpenChange(false)
      onCreated(row?.pipeline_id)
      if (row?.pipeline_id) qc.invalidateQueries({ queryKey: ['deals', String(row.pipeline_id)] })
    },
    onError: (e: any) => {
      console.error('Deal creation failed:', e)
      const errorMessage = e?.message || 'Onbekende fout'
      const errorDetails = e?.details || ''
      const errorHint = e?.hint || ''
      
      let displayMessage = errorMessage
      if (errorDetails) displayMessage += ` - ${errorDetails}`
      if (errorHint) displayMessage += ` (${errorHint})`
      
      toast({ 
        title: 'Aanmaken mislukt', 
        description: displayMessage,
        variant: 'destructive' 
      })
    }
  })

  const handleSubmit = async () => {
    console.log('Submitting deal creation with draft:', draft)
    
    // Validatie
    if (!draft.title?.trim()) return toast({ title: 'Titel is verplicht', variant: 'destructive' })
    if (!draft.pipeline_id) return toast({ title: 'Pipeline is verplicht', variant: 'destructive' })
    if (!draft.stage_id) return toast({ title: 'Stage is verplicht', variant: 'destructive' })
    if (!draft.company_id) return toast({ title: 'Bedrijf is verplicht', variant: 'destructive' })
    if (!draft.contact_id) return toast({ title: 'Contact is verplicht', variant: 'destructive' })

    // Controleer auth status
    if (!profile?.client_id) {
      console.error('No client_id found in profile:', profile)
      return toast({ title: 'Authenticatie probleem: geen client ID gevonden', variant: 'destructive' })
    }

    if (stages.length && !stages.some((s: any) => s.id === draft.stage_id)) {
      return toast({ title: 'Stage hoort niet bij pipeline', variant: 'destructive' })
    }

    const numericValue = typeof draft.value === 'number' && Number.isFinite(draft.value) ? Math.max(0, draft.value) : null
    const confidenceClamped = Math.min(100, Math.max(0, draft.confidence || 50))

    const payload = {
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      value: numericValue,
      currency: (draft.currency || 'EUR').trim(),
      confidence: confidenceClamped,
      company_id: draft.company_id,
      stage_id: draft.stage_id,
      pipeline_id: draft.pipeline_id,
      contact_id: draft.contact_id,
      status: 'open',
      // client_id wordt automatisch ingesteld door de database trigger
    } as any

    console.log('Final payload for deal creation:', payload)
    await createMutation.mutateAsync(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[90vh] bg-background/95 backdrop-blur-xl border-0 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-white">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Nieuwe Deal Aanmaken
          </DialogTitle>
          <p className="text-blue-100 mt-2">Maak een nieuwe sales opportunity aan en start je verkoopproces</p>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-250px)] pr-6">
          <div className="space-y-8 px-8 py-6">
            {/* Basis Informatie */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">Basis Informatie</h3>
              </div>
              
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Deal Titel
                  </Label>
                  <Input 
                    value={draft.title} 
                    onChange={e => setDraft({ ...draft, title: e.target.value })} 
                    placeholder="Bijv. Website redesign project voor Acme Corp"
                    className="h-12 bg-white/5 border-white/10 focus:border-blue-400/50 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Bedrijf
                    </Label>
                    <Select value={draft.company_id || ''} onValueChange={v => setDraft({ ...draft, company_id: v, contact_id: undefined })}>
                      <SelectTrigger className="h-12 bg-white/5 border-white/10 focus:border-blue-400/50">
                        <SelectValue placeholder="Selecteer een bedrijf" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Contact className="w-4 h-4" />
                      Contactpersoon
                    </Label>
                    <Select value={draft.contact_id || ''} onValueChange={v => setDraft({ ...draft, contact_id: v })}>
                      <SelectTrigger className="h-12 bg-white/5 border-white/10 focus:border-blue-400/50">
                        <SelectValue placeholder="Selecteer contactpersoon" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContacts.map((ct: any) => (
                          <SelectItem key={ct.id} value={ct.id}>
                            {ct.first_name} {ct.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Financiële Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Euro className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold">Financiële Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Deal Waarde</Label>
                  <Input 
                    type="number" 
                    placeholder="€ 0,00" 
                    value={draft.value ?? ''} 
                    onChange={e => setDraft({ ...draft, value: parseFloat(e.target.value) || undefined })}
                    className="h-12 bg-white/5 border-white/10 focus:border-emerald-400/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Valuta</Label>
                  <Select value={draft.currency} onValueChange={v => setDraft({ ...draft, currency: v })}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 focus:border-emerald-400/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Kans van Slagen
                  </Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      min={0} 
                      max={100} 
                      value={draft.confidence ?? 50} 
                      onChange={e => setDraft({ ...draft, confidence: parseInt(e.target.value) || 50 })}
                      className="h-12 bg-white/5 border-white/10 focus:border-blue-400/50 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline & Stage */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold">Pipeline & Status</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pipeline</Label>
                  <Select value={draft.pipeline_id || ''} onValueChange={v => setDraft({ ...draft, pipeline_id: v, stage_id: undefined })}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 focus:border-purple-400/50">
                      <SelectValue placeholder="Selecteer pipeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelines.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fase</Label>
                  <Select value={draft.stage_id || ''} onValueChange={v => setDraft({ ...draft, stage_id: v })}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 focus:border-purple-400/50">
                      <SelectValue placeholder="Selecteer fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Beschrijving */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold">Beschrijving</h3>
              </div>
              <Textarea 
                placeholder="Voeg details toe over deze deal, requirements, timeline, etc..."
                value={draft.description || ''} 
                onChange={e => setDraft({ ...draft, description: e.target.value })}
                className="min-h-[120px] bg-white/5 border-white/10 focus:border-blue-400/50 resize-none"
              />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="p-8 pt-4 gap-3 bg-gray-50/50 dark:bg-slate-900/50 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-w-[120px]">Annuleren</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white min-w-[180px]">
            {createMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Aanmaken...
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Deal Aanmaken
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
