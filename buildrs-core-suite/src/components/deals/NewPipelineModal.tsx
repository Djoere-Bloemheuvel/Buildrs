import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useConvexAuth } from '@/hooks/useConvexAuth'
import type { Id } from '../../../convex/_generated/dataModel'

type StageDraft = { name: string; probability: number }

export default function NewPipelineModal({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const { toast } = useToast()
  const { getClientId } = useConvexAuth()
  const clientId = getClientId()
  const [name, setName] = useState('')
  const [selectedPropositionId, setSelectedPropositionId] = useState<Id<"propositions"> | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [stages, setStages] = useState<StageDraft[]>([
    { name: 'Prospect', probability: 10 },
    { name: 'Qualified', probability: 30 },
    { name: 'Proposal', probability: 60 },
    { name: 'Negotiation', probability: 80 },
    { name: 'Won', probability: 95 },
  ])

  const addStage = () => setStages(prev => [...prev, { name: '', probability: 0 }])
  const removeStage = (idx: number) => setStages(prev => prev.filter((_, i) => i !== idx))

  // Load propositions for the client
  const propositions = useQuery(api.propositions.getByClient, clientId ? { clientId } : "skip")
  
  const createPipelineMutation = useMutation(api.pipelines.create)
  const createStagesBulkMutation = useMutation(api.stages.createBulk)

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: 'Naam is verplicht', variant: 'destructive' })
      return
    }

    if (!clientId) {
      toast({ title: 'Geen client ID gevonden', variant: 'destructive' })
      return
    }

    if (!selectedPropositionId) {
      toast({ title: 'Selecteer een propositie', variant: 'destructive' })
      return
    }

    setIsCreating(true)

    try {
      // Create pipeline first
      const pipelineId = await createPipelineMutation({
        name: name.trim(),
        clientId,
        propositionId: selectedPropositionId,
        isDefault: true // Make first pipeline default
      })

      // Create stages
      const stagePayload = stages
        .map((s, i) => ({
          name: s.name.trim(),
          position: i + 1,
          defaultProbability: Math.max(0, Math.min(100, Number(s.probability) || 0)),
          pipelineId
        }))
        .filter(s => s.name)

      if (stagePayload.length > 0) {
        await createStagesBulkMutation({ stages: stagePayload })
      }

      toast({ 
        title: '✅ Pipeline aangemaakt', 
        description: `${name} is succesvol aangemaakt`,
        duration: 3000
      })
      
      // Reset form state
      setName('')
      setSelectedPropositionId(null)
      setStages([
        { name: 'Prospect', probability: 10 },
        { name: 'Qualified', probability: 30 },
        { name: 'Proposal', probability: 60 },
        { name: 'Negotiation', probability: 80 },
        { name: 'Won', probability: 95 },
      ])
      
      // Close modal and refresh parent
      onOpenChange(false)
      onCreated()
    } catch (error: any) {
      toast({ 
        title: 'Aanmaken mislukt', 
        description: error?.message || 'Er ging iets mis. Probeer het opnieuw.',
        variant: 'destructive' 
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full h-[80vh] bg-background/95 backdrop-blur-xl border-0 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-white">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg"><Sparkles className="w-4 h-4 text-white" /></div>
            Nieuwe Pipeline
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-200px)] pr-6">
          <div className="space-y-6 px-6 py-5">
            <div className="space-y-2">
              <Label>Naam</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Bijv. Sales NL" className="h-10" />
            </div>

            <div className="space-y-2">
              <Label>Propositie</Label>
              <Select value={selectedPropositionId || ""} onValueChange={(value) => setSelectedPropositionId(value as Id<"propositions">)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecteer een propositie" />
                </SelectTrigger>
                <SelectContent>
                  {propositions?.map((prop) => (
                    <SelectItem key={prop._id} value={prop._id}>
                      {prop.name}
                    </SelectItem>
                  ))}
                  {(!propositions || propositions.length === 0) && (
                    <SelectItem value="" disabled>
                      Geen proposities beschikbaar
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Stages</Label>
                <Button size="sm" variant="outline" onClick={addStage}><Plus className="w-4 h-4 mr-2" />Stage toevoegen</Button>
              </div>
              <div className="grid gap-3">
                {stages.map((s, i) => (
                  <div key={i} className="grid grid-cols-12 gap-3 items-center">
                    <Input value={s.name} onChange={e => setStages(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder={`Naam stage ${i + 1}`} className="col-span-7 h-10" />
                    <div className="col-span-3 relative">
                      <Input type="number" min={0} max={100} value={s.probability} onChange={e => setStages(prev => prev.map((x, idx) => idx === i ? { ...x, probability: parseInt(e.target.value || '0') } : x))} className="h-10 pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeStage(i)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Annuleren</Button>
          <Button onClick={handleSubmit} disabled={isCreating || !name.trim() || !selectedPropositionId} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            {isCreating ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Aanmaken...
              </>
            ) : (
              'Pipeline Aanmaken'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

