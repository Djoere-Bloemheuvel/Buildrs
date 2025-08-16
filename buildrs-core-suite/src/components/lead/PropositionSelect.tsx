import { useState, useMemo } from 'react'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ChevronsUpDown, Check, Plus, Package, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConvexAuth } from '@/hooks/useConvexAuth'
import { useToast } from '@/hooks/use-toast'

type Option = { id: string; name: string }

export default function PropositionSelect({ value, onChange, placeholder = 'Kies propositie…' }: { value?: string | null; onChange: (id: string) => void, placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const { getClientId } = useConvexAuth()
  const { toast } = useToast()
  const [draftName, setDraftName] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftOfferType, setDraftOfferType] = useState<'service' | 'product'>('service')
  const [isCreating, setIsCreating] = useState(false)

  const clientId = getClientId()
  
  // Fetch propositions from Convex
  const propositionsData = useQuery(api.propositions.list, 
    clientId ? { clientId } : "skip"
  )
  
  const createMutation = useMutation(api.propositions.create)

  const options: Option[] = useMemo(() => {
    return (propositionsData ?? []).map(p => ({ 
      id: p._id, 
      name: p.name 
    }))
  }, [propositionsData])

  const add = async () => {
    if (!draftName.trim() || !clientId || isCreating) return
    
    const propositionName = draftName.trim()
    setIsCreating(true)
    
    try {
      const propositionId = await createMutation({
        name: propositionName,
        description: draftDescription.trim() || undefined,
        offerType: draftOfferType,
        clientId,
      })
      
      // Smooth transition: first select the proposition
      onChange(propositionId)
      
      // Reset form state
      setDraftName('')
      setDraftDescription('')
      setDraftOfferType('service')
      
      // Close with a short delay for smoother UX
      setTimeout(() => {
        setCreateOpen(false)
        setIsCreating(false)
      }, 200)
      
      // Show user-friendly toast after closing
      setTimeout(() => {
        toast({
          title: '✅ Propositie opgeslagen',
          description: `${propositionName} is klaar voor gebruik in campagnes`
        })
      }, 400)
      
    } catch (error: any) {
      setIsCreating(false)
      toast({
        title: 'Kon propositie niet opslaan',
        description: 'Probeer het opnieuw of neem contact op'
      })
    }
  }

  const handleCancel = () => {
    // Reset form with smooth transition
    setDraftName('')
    setDraftDescription('')
    setDraftOfferType('service')
    setIsCreating(false)
    
    setTimeout(() => {
      setCreateOpen(false)
    }, 100)
  }

  const selected = useMemo(() => {
    const vid = (value ?? '') as string
    return options.find(o => o.id === vid)?.name
  }, [options, value])

  return (
    <div className="flex items-center gap-2 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {selected || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 max-h-[70vh] overflow-auto bg-background border shadow-lg">
          <Command className="bg-background">
            <CommandInput placeholder="Zoek propositie..." />
            <CommandList className="max-h-72 overflow-auto bg-background">
              <CommandEmpty className="bg-background">Geen proposities gevonden</CommandEmpty>
              <CommandGroup heading="Beschikbare Proposities" className="bg-background">
                {options.map(o => (
                  <CommandItem key={o.id} value={o.name} onSelect={() => { onChange(o.id); setOpen(false) }}>
                    <Check className={cn('mr-2 h-4 w-4', value === o.id ? 'opacity-100' : 'opacity-0')} />
                    {o.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup className="bg-background">
                <CommandItem onSelect={() => { setCreateOpen(true) }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe propositie aanmaken
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl w-full bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-blue-950/20 dark:to-purple-950/20 border-2 border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 shadow-2xl backdrop-blur-xl overflow-hidden">
          <DialogHeader className="space-y-4 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                  Nieuwe Propositie
                </DialogTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Maak een nieuwe propositie aan voor je campagnes
                </p>
              </div>
            </div>
            
            {/* Feature Showcase */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="flex items-center gap-2 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">AI Geoptimaliseerd</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Campagne Klaar</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Client Gebonden</span>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Propositie Naam *
              </label>
              <Input 
                value={draftName} 
                onChange={e=>setDraftName(e.target.value)} 
                placeholder="Bijv. LinkedIn Outbound Service, SaaS Sales Funnel Setup"
                className="bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Type Aanbieding
              </label>
              <Select value={draftOfferType} onValueChange={(v)=>setDraftOfferType(v as 'service'|'product')}>
                <SelectTrigger className="bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 focus:border-blue-500 dark:focus:border-blue-400">
                  <SelectValue placeholder="Selecteer type aanbieding" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50">
                  <SelectItem value="service" className="focus:bg-blue-50 dark:focus:bg-blue-950/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Dienstverlening
                    </div>
                  </SelectItem>
                  <SelectItem value="product" className="focus:bg-purple-50 dark:focus:bg-purple-950/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Product
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Beschrijving
              </label>
              <Textarea 
                value={draftDescription} 
                onChange={e=>setDraftDescription(e.target.value)} 
                placeholder="Korte omschrijving van je propositie en wat het oplevert voor klanten..."
                rows={4}
                className="bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 resize-none"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-3 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isCreating}
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
            >
              Annuleren
            </Button>
            <Button 
              disabled={!draftName.trim() || isCreating} 
              onClick={add}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[120px]"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Opslaan...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Aanmaken
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

