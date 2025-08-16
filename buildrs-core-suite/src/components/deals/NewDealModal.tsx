
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useConvexAuth } from '@/hooks/useConvexAuth'
import { Building2, Contact, Euro, Percent, Target, FileText, Sparkles, Package, Check } from 'lucide-react'
import type { Id } from "../../../convex/_generated/dataModel"
import PropositionSelect from '@/components/lead/PropositionSelect'

type Pipeline = { 
  _id: Id<"pipelines">; 
  name: string;
  isDefault?: boolean;
}

type Stage = {
  _id: Id<"stages">;
  name: string;
  position: number;
  defaultProbability?: number;
}

type Company = {
  _id: Id<"companies">;
  name: string;
}

type Contact = {
  _id: Id<"contacts">;
  firstName?: string;
  lastName?: string;
  companyId?: Id<"companies">;
}

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
  activePipeline: Id<"pipelines"> | null
  onCreated: (pipelineId?: Id<"pipelines">) => void
}) {
  const { user, getClientId } = useConvexAuth()
  const { toast } = useToast()
  const clientId = getClientId()
  const [isCreating, setIsCreating] = useState(false)

  const [draft, setDraft] = useState<{
    title: string
    companyId?: Id<"companies">
    contactId?: Id<"contacts">
    propositionId?: Id<"propositions">
    value?: number
    currency: string
    pipelineId?: Id<"pipelines">
    stageId?: Id<"stages">
    description?: string
  }>({ title: '', currency: 'EUR' })

  const createMutation = useMutation(api.deals.create)

  // Prefill when modal opens
  useEffect(() => {
    if (open) {
      setDraft({
        title: '',
        currency: 'EUR',
        pipelineId: activePipeline || pipelines?.[0]?._id,
        stageId: undefined,
        companyId: undefined,
        contactId: undefined,
        propositionId: undefined,
        description: '',
      })
    }
  }, [open, activePipeline, pipelines])

  // Stages for selected pipeline
  const stagesData = useQuery(api.stages.getByPipeline, 
    draft.pipelineId ? { pipelineId: draft.pipelineId } : "skip"
  )
  const stages = stagesData || []

  // Auto-select first stage when available
  useEffect(() => {
    if (open && draft.pipelineId && stages.length && !draft.stageId) {
      setDraft(prev => ({ ...prev, stageId: stages[0]._id }))
    }
  }, [open, draft.pipelineId, stages, draft.stageId])

  // Companies & contacts from Convex
  const companiesData = useQuery(api.companies.list, 
    clientId ? { limit: 100 } : "skip"
  )
  const allCompanies = companiesData || []
  
  const contactsData = useQuery(api.contacts.list, 
    clientId ? { clientId, limit: 100 } : "skip"
  )
  const contacts = contactsData || []

  // Only show companies that have at least one contact
  const companies = useMemo(() => {
    if (!contacts.length) return []
    const companyIdsWithContacts = new Set(
      contacts.map((c: Contact) => c.companyId).filter(Boolean)
    )
    return allCompanies.filter((company: Company) => 
      companyIdsWithContacts.has(company._id)
    )
  }, [allCompanies, contacts])

  const availableContacts = useMemo(() => {
    // Show all contacts if no company is selected, or filter by company
    if (!draft.companyId) return contacts
    return contacts.filter((c: Contact) => c.companyId === draft.companyId)
  }, [contacts, draft.companyId])


  const handleSubmit = async () => {
    // Validatie
    if (!draft.title?.trim()) return toast({ title: 'Titel is verplicht', variant: 'destructive' })
    if (!draft.pipelineId) return toast({ title: 'Pipeline is verplicht', variant: 'destructive' })
    if (!draft.stageId) return toast({ title: 'Stage is verplicht', variant: 'destructive' })
    if (!clientId) return toast({ title: 'Geen client ID gevonden', variant: 'destructive' })

    if (stages.length && !stages.some((s: Stage) => s._id === draft.stageId)) {
      return toast({ title: 'Stage hoort niet bij pipeline', variant: 'destructive' })
    }

    const numericValue = typeof draft.value === 'number' && Number.isFinite(draft.value) ? Math.max(0, draft.value) : undefined
    
    // Get confidence from selected stage's defaultProbability
    const selectedStage = stages.find((s: Stage) => s._id === draft.stageId)
    const confidence = selectedStage?.defaultProbability || 50

    setIsCreating(true)
    
    try {
      const dealId = await createMutation({
        title: draft.title.trim(),
        description: draft.description?.trim(),
        value: numericValue,
        currency: draft.currency || 'EUR',
        confidence,
        companyId: draft.companyId,
        contactId: draft.contactId,
        propositionId: draft.propositionId,
        stageId: draft.stageId!,
        pipelineId: draft.pipelineId!,
        clientId,
      })
      
      // Close modal with smooth transition
      setTimeout(() => {
        onOpenChange(false)
        setIsCreating(false)
      }, 200)
      
      // Show success toast
      setTimeout(() => {
        toast({
          title: '✅ Deal aangemaakt',
          description: `${draft.title} is toegevoegd aan je pipeline`
        })
      }, 400)
      
      onCreated(draft.pipelineId)
      
    } catch (error: any) {
      setIsCreating(false)
      toast({ 
        title: 'Aanmaken mislukt', 
        description: error?.message || 'Er ging iets mis. Probeer het opnieuw.',
        variant: 'destructive' 
      })
    }
  }
  
  const handleCancel = () => {
    setIsCreating(false)
    setTimeout(() => {
      onOpenChange(false)
    }, 100)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] bg-background/95 backdrop-blur-xl border-0 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-white">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            Nieuwe Deal
          </DialogTitle>
          <p className="text-blue-100 mt-2">
            Creëer een nieuwe sales opportunity en voeg deze toe aan je pipeline
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-220px)] pr-6">
          <div className="space-y-8 px-8 py-6">
            {/* Deal Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <label className="text-sm font-medium">
                  Deal Informatie *
                </label>
              </div>
              
              <Input 
                value={draft.title} 
                onChange={e => setDraft({ ...draft, title: e.target.value })} 
                placeholder="Bijv. Website redesign project voor Acme Corp"
                className="h-11"
              />
            </div>

            {/* Contact & Company Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <label className="text-sm font-medium">
                  Bedrijf & Contact
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm text-muted-foreground">Bedrijf</label>
                  <Select value={draft.companyId || ''} onValueChange={v => setDraft({ ...draft, companyId: v as Id<"companies">, contactId: undefined })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecteer een bedrijf" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c: Company) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-muted-foreground">Contactpersoon</label>
                  <Select value={draft.contactId || ''} onValueChange={v => setDraft({ ...draft, contactId: v ? v as Id<"contacts"> : undefined })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecteer contactpersoon" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableContacts.length > 0 ? (
                        availableContacts.map((ct: Contact) => (
                          <SelectItem key={ct._id} value={ct._id}>
                            {ct.firstName || ct.lastName ? 
                              `${ct.firstName || ''} ${ct.lastName || ''}`.trim() : 
                              `Contact ${ct._id.slice(-6)}`
                            }
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          {draft.companyId ? 'Geen contactpersonen voor dit bedrijf' : 'Geen contactpersonen beschikbaar'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Proposition Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <label className="text-sm font-medium">
                  Propositie
                </label>
              </div>
              <PropositionSelect 
                value={draft.propositionId} 
                onChange={(id) => setDraft({ ...draft, propositionId: id as Id<"propositions"> })} 
                placeholder="Kies een propositie voor deze deal..."
              />
            </div>
            
            {/* Financial Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-blue-600" />
                <label className="text-sm font-medium">
                  Financieel
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm text-muted-foreground">Deal Waarde</label>
                  <Input 
                    type="number" 
                    placeholder="€ 0,00" 
                    value={draft.value ?? ''} 
                    onChange={e => setDraft({ ...draft, value: parseFloat(e.target.value) || undefined })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-muted-foreground">Valuta</label>
                  <Select value={draft.currency} onValueChange={v => setDraft({ ...draft, currency: v })}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pipeline & Stage Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <label className="text-sm font-medium">
                  Pipeline & Fase *
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm text-muted-foreground">Pipeline</label>
                  <Select value={draft.pipelineId || ''} onValueChange={v => setDraft({ ...draft, pipelineId: v as Id<"pipelines">, stageId: undefined })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecteer pipeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelines.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-muted-foreground">Fase</label>
                  <Select value={draft.stageId || ''} onValueChange={v => setDraft({ ...draft, stageId: v as Id<"stages"> })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecteer fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((s: Stage) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <label className="text-sm font-medium">
                  Deal Beschrijving
                </label>
              </div>
              <Textarea 
                placeholder="Voeg details toe over deze deal, requirements, timeline, etc..."
                value={draft.description || ''} 
                onChange={e => setDraft({ ...draft, description: e.target.value })}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Next Steps Info Card */}
            <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg border border-blue-200/40 dark:border-blue-800/40">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-2">
                    Volgende Stappen
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    Na het aanmaken kun je direct de deal verder uitwerken, documenten toevoegen en de voortgang bijhouden in je pipeline.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                      Pipeline tracking
                    </span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                      Deal follow-up
                    </span>
                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded text-xs">
                      Voortgang bijwerken
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-8 pt-4 gap-3 bg-gray-50/50 dark:bg-slate-900/50 border-t">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isCreating}
            className="min-w-[120px]"
          >
            Annuleren
          </Button>
          <Button 
            disabled={!draft.title.trim() || !draft.pipelineId || !draft.stageId || isCreating} 
            onClick={handleSubmit}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white min-w-[180px]"
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Aanmaken...
              </div>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Deal Aanmaken
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
