
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPropositions, createProposition, updateProposition, deleteProposition } from '@/data/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, MoreHorizontal, Edit, Trash2, Star, Sparkles } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function PropositionsPage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all'|'service'|'product'|'consulting'|'training'>('all')

  const { data: propositions, isLoading } = useQuery({
    queryKey: ['propositions', search, profile?.client_id],
    queryFn: () => fetchPropositions(search, profile?.client_id),
    staleTime: 5 * 60_000,
  })

  const [draft, setDraft] = useState({
    name: '',
    description: '',
    target_audience: '',
    unique_value: '',
    offer_type: 'service',
    pain_triggers: '',
    problems_solved: '',
  })

  const createMutation = useMutation({
    mutationFn: createProposition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propositions'] })
      setOpenCreate(false)
      setDraft({
        name: '',
        description: '',
        target_audience: '',
        unique_value: '',
        offer_type: 'service',
        pain_triggers: '',
        problems_solved: '',
      })
      toast({ title: 'Propositie aangemaakt' })
    },
    onError: (error) => {
      toast({
        title: 'Fout bij aanmaken',
        description: error instanceof Error ? error.message : 'Onbekende fout',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateProposition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propositions'] })
      setEditingId(null)
      toast({ title: 'Propositie bijgewerkt' })
    },
    onError: (error) => {
      toast({
        title: 'Fout bij bijwerken',
        description: error instanceof Error ? error.message : 'Onbekende fout',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProposition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propositions'] })
      toast({ title: 'Propositie verwijderd' })
    },
    onError: (error) => {
      toast({
        title: 'Fout bij verwijderen',
        description: error instanceof Error ? error.message : 'Onbekende fout',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = () => {
    if (!profile?.client_id) {
      toast({
        title: 'Geen client gevonden',
        description: 'Je moet ingelogd zijn om proposities aan te maken',
        variant: 'destructive',
      })
      return
    }

    const propositionData = {
      ...draft,
      client_id: profile.client_id,
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: propositionData })
    } else {
      createMutation.mutate(propositionData)
    }
  }

  const filteredPropositionsRaw = propositions?.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.target_audience?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const filteredPropositions = filteredPropositionsRaw.filter(p => {
    if (typeFilter === 'all') return true
    return (p.offer_type || '').toLowerCase() === typeFilter
  })

  const kpis = {
    total: propositions?.length || 0,
    results: filteredPropositions.length,
    services: (propositions || []).filter((p: any) => (p.offer_type || '').toLowerCase() === 'service').length,
    products: (propositions || []).filter((p: any) => (p.offer_type || '').toLowerCase() === 'product').length,
  }

  return (
    <div className="space-y-6">
      <div className="glass-surface overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
            <div>
              <h1 className="text-2xl font-semibold">Proposities</h1>
              <p className="text-blue-100">Beheer je service en product proposities</p>
            </div>
            <Button onClick={() => {
            setDraft({
              name: '',
              description: '',
              target_audience: '',
              unique_value: '',
              offer_type: 'service',
              pain_triggers: '',
              problems_solved: '',
            })
            setEditingId(null)
            setOpenCreate(true)
            }} className="bg-white/10 hover:bg-white/15 text-white border-0">
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe propositie
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-sm">
              <div className="text-blue-100">Totaal</div>
              <div className="text-xl font-semibold">{kpis.total}</div>
            </div>
            <div className="text-sm">
              <div className="text-blue-100">Resultaten</div>
              <div className="text-xl font-semibold">{kpis.results}</div>
            </div>
            <div className="text-sm">
              <div className="text-blue-100">Services</div>
              <div className="text-xl font-semibold">{kpis.services}</div>
            </div>
            <div className="text-sm">
              <div className="text-blue-100">Producten</div>
              <div className="text-xl font-semibold">{kpis.products}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-surface p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek proposities..."
            className="pl-10 bg-transparent"
          />
        </div>
        <div className="mt-4">
          <Tabs defaultValue="all" value={typeFilter} onValueChange={(v)=> setTypeFilter(v as any)}>
            <TabsList className="grid grid-cols-5 max-w-[520px]">
              <TabsTrigger value="all">Alle</TabsTrigger>
              <TabsTrigger value="service">Service</TabsTrigger>
              <TabsTrigger value="product">Product</TabsTrigger>
              <TabsTrigger value="consulting">Consulting</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        (filteredPropositions.length === 0 ? (
          <div className="glass-surface p-10 text-center text-muted-foreground rounded-xl">
            Geen proposities gevonden.
            <div className="mt-4">
              <Button onClick={()=> { setEditingId(null); setOpenCreate(true) }} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">Nieuwe propositie</Button>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPropositions.map((proposition) => (
            <Card
              key={proposition.id}
              className="border-0 bg-gradient-to-br from-background to-muted/30 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
              onClick={() => {
                setDraft({
                  name: proposition.name || '',
                  description: proposition.description || '',
                  target_audience: proposition.target_audience || '',
                  unique_value: proposition.unique_value || '',
                  offer_type: proposition.offer_type || 'service',
                  pain_triggers: proposition.pain_triggers || '',
                  problems_solved: proposition.problems_solved || '',
                })
                setEditingId(proposition.id)
                setOpenCreate(true)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setDraft({
                    name: proposition.name || '',
                    description: proposition.description || '',
                    target_audience: proposition.target_audience || '',
                    unique_value: proposition.unique_value || '',
                    offer_type: proposition.offer_type || 'service',
                    pain_triggers: proposition.pain_triggers || '',
                    problems_solved: proposition.problems_solved || '',
                  })
                  setEditingId(proposition.id)
                  setOpenCreate(true)
                }
              }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2">{proposition.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="capitalize">{proposition.offer_type || '—'}</Badge>
                      <Star className="w-4 h-4 text-yellow-500" />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-surface min-w-[180px]" onClick={(e)=> e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => {
                        setDraft({
                          name: proposition.name || '',
                          description: proposition.description || '',
                          target_audience: proposition.target_audience || '',
                          unique_value: proposition.unique_value || '',
                          offer_type: proposition.offer_type || 'service',
                          pain_triggers: proposition.pain_triggers || '',
                          problems_solved: proposition.problems_solved || '',
                        })
                        setEditingId(proposition.id)
                        setOpenCreate(true)
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Bewerken
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(proposition.id) }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {proposition.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {proposition.description}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {proposition.target_audience && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Doelgroep</span>
                      <p className="text-sm mt-1 line-clamp-2 text-foreground/90">{proposition.target_audience}</p>
                    </div>
                  )}
                  {proposition.unique_value && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Unieke waarde</span>
                      <p className="text-sm mt-1 line-clamp-2 text-foreground/90">{proposition.unique_value}</p>
                    </div>
                  )}
                </div>
                {(proposition.pain_triggers || proposition.problems_solved) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {proposition.pain_triggers && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Pijnpunten</span>
                        <p className="text-sm mt-1 line-clamp-2 text-foreground/90">{proposition.pain_triggers}</p>
                      </div>
                    )}
                    {proposition.problems_solved && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Opgeloste problemen</span>
                        <p className="text-sm mt-1 line-clamp-2 text-foreground/90">{proposition.problems_solved}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        ))
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-5xl w-full h-[90vh] bg-background/95 backdrop-blur-xl border-0 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 pb-6">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-white">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {editingId ? 'Propositie bewerken' : 'Nieuwe propositie'}
            </DialogTitle>
            <p className="text-blue-100 mt-2">Definieer een krachtige waardepropositie voor je campagnes</p>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-240px)] pr-6">
            <div className="space-y-8 px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Naam *</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Naam van de propositie"
                      className="h-12 bg-white/5 border-white/10 focus:border-blue-400/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Type</Label>
                  <Select
                    value={draft.offer_type}
                    onValueChange={(v) => setDraft({ ...draft, offer_type: v })}
                  >
                      <SelectTrigger className="h-12 bg-white/5 border-white/10 focus:border-blue-400/50">
                      <SelectValue placeholder="Kies type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Doelgroep</Label>
                  <Textarea
                    value={draft.target_audience}
                    onChange={(e) => setDraft({ ...draft, target_audience: e.target.value })}
                    placeholder="Beschrijf de doelgroep..."
                      className="min-h-[100px] bg-white/5 border-white/10 focus:border-blue-400/50"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Beschrijving</Label>
                  <Textarea
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="Beschrijf de propositie..."
                      className="min-h-[100px] bg-white/5 border-white/10 focus:border-blue-400/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Unieke waarde</Label>
                  <Textarea
                    value={draft.unique_value}
                    onChange={(e) => setDraft({ ...draft, unique_value: e.target.value })}
                    placeholder="Wat maakt dit uniek..."
                      className="min-h-[100px] bg-white/5 border-white/10 focus:border-blue-400/50"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm">Pijnpunten</Label>
                <Textarea
                  value={draft.pain_triggers}
                  onChange={(e) => setDraft({ ...draft, pain_triggers: e.target.value })}
                  placeholder="Welke pijnpunten lost dit op..."
                    className="min-h-[100px] bg-white/5 border-white/10 focus:border-blue-400/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Opgeloste problemen</Label>
                <Textarea
                  value={draft.problems_solved}
                  onChange={(e) => setDraft({ ...draft, problems_solved: e.target.value })}
                  placeholder="Welke problemen worden opgelost..."
                    className="min-h-[100px] bg-white/5 border-white/10 focus:border-blue-400/50"
                />
              </div>
            </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 pt-4 gap-3 bg-gray-50/50 dark:bg-slate-900/50 border-t">
            <Button variant="outline" onClick={() => setOpenCreate(false)} className="min-w-[120px]">
              Annuleren
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!draft.name.trim() || createMutation.isPending || updateMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white min-w-[160px]"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {editingId ? 'Bijwerken…' : 'Aanmaken…'}
                </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {editingId ? 'Propositie bijwerken' : 'Propositie aanmaken'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
