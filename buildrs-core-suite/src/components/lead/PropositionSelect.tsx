import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ChevronsUpDown, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

type Option = { id: string; name: string }

export default function PropositionSelect({ value, onChange, placeholder = 'Kies propositie…' }: { value?: string | null; onChange: (id: string) => void, placeholder?: string }) {
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const { profile } = useAuth()
  const [draftName, setDraftName] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftOfferType, setDraftOfferType] = useState<'service' | 'product'>('service')
  const [draftPainTriggers, setDraftPainTriggers] = useState('')
  const [draftProblemsSolved, setDraftProblemsSolved] = useState('')

  const load = useCallback(async () => {
    if (loading || options.length) return
    setLoading(true)
    const { data } = await supabase.from('propositions').select('id,name').order('name')
    setOptions((data ?? []).map(d => ({ id: d.id as string, name: d.name as string })))
    setLoading(false)
  }, [loading, options.length])

  async function add() {
    if (!draftName.trim()) return
    const payload: any = {
      name: draftName.trim(),
      description: draftDescription.trim() || null,
      offer_type: draftOfferType,
      pain_triggers: draftPainTriggers.trim() || null,
      problems_solved: draftProblemsSolved.trim() || null,
    }
    if (profile?.client_id) payload.client_id = profile.client_id

    const { data, error } = await supabase
      .from('propositions')
      .insert(payload)
      .select('id,name')
      .single()
    if (!error && data) {
      setOptions(prev => [...prev, { id: data.id as string, name: data.name as string }])
      onChange(data.id as string)
      setDraftName('')
      setDraftDescription('')
      setDraftPainTriggers('')
      setDraftProblemsSolved('')
      setCreateOpen(false)
    }
  }

  useEffect(() => { void load() }, [load])

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
            <CommandInput placeholder="Zoek propositie…" />
            <CommandList className="max-h-72 overflow-auto bg-background">
              <CommandEmpty className="bg-background">Geen resultaten</CommandEmpty>
              <CommandGroup heading="Proposities" className="bg-background">
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
                  Nieuwe propositie
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nieuwe propositie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Naam</label>
              <Input value={draftName} onChange={e=>setDraftName(e.target.value)} placeholder="Bijv. LinkedIn Outbound Service" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Type</label>
                <Select value={draftOfferType} onValueChange={(v)=>setDraftOfferType(v as 'service'|'product')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kies type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Dienst</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Beschrijving</label>
              <Textarea value={draftDescription} onChange={e=>setDraftDescription(e.target.value)} placeholder="Korte omschrijving van de propositie" rows={3} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Pain triggers (optioneel)</label>
                <Textarea value={draftPainTriggers} onChange={e=>setDraftPainTriggers(e.target.value)} rows={3} placeholder="Waar heeft de klant last van?" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Problems solved (optioneel)</label>
                <Textarea value={draftProblemsSolved} onChange={e=>setDraftProblemsSolved(e.target.value)} rows={3} placeholder="Welke problemen lossen we op?" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={()=>setCreateOpen(false)}>Annuleren</Button>
            <Button disabled={!draftName.trim()} onClick={add}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

