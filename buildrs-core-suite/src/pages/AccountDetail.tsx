import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, Globe2, MapPin, Users as UsersIcon, Phone, Mail, Linkedin, Calendar, Plus, Eye, Filter, Search, FileText, Target, Zap, TrendingUp, Clock, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useState } from 'react'

type Company = {
  id: string
  name: string
  domain: string | null
  website: string | null
  industry: string | null
  industry_label?: string | null
  subindustry_label?: string | null
  location: string | null
  company_size: number | null
  company_summary: string | null
}

type Contact = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  job_title: string | null
  function_group: string | null
}

type Deal = {
  id: string
  title: string
  value: number | null
  status: string
  created_at: string
}

type Communication = {
  id: string
  created_at: string
  channel: string
  type: string
  direction: string
  content: string
  sentiment: string | null
}

async function fetchCompany(companyId: string) {
  const { data, error } = await supabase
    .from('v_company_overview_full' as never)
    .select('*')
    .eq('id', companyId)
    .maybeSingle()
  if (error) throw error
  return data as Company | null
}

async function fetchCompanyContacts(companyId: string, clientId: string) {
  const { data, error } = await supabase
    .from('v_company_contacts' as never)
    .select('id, first_name, last_name, email, job_title, function_group')
    .eq('company_id', companyId)
    .order('first_name', { ascending: true })
  if (error) throw error
  return (data || []) as Contact[]
}

async function fetchCompanyDeals(companyId: string) {
  const { data, error } = await supabase
    .from('deals')
    .select('id, title, value, status, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as Deal[]
}

async function fetchCompanyTimeline(companyId: string) {
  const { data, error } = await supabase
    .from('v_company_timeline' as never)
    .select('id, occurred_at, channel, type, direction, content, sentiment')
    .eq('company_id', companyId)
    .order('occurred_at', { ascending: false })
    .limit(50)
  if (error) throw error
  
  // Map the data to the expected Communication type
  const rows = (data || []) as any[]
  return rows.map(r => ({
    id: r.id || '',
    created_at: r.occurred_at || new Date().toISOString(),
    channel: r.channel || 'activity',
    type: r.type || 'activity',
    direction: r.direction || '',
    content: r.content || '',
    sentiment: r.sentiment || null,
  })) as Communication[]
}

function getLogo(domain?: string | null) {
  if (!domain) return null
  const clean = domain.replace(/^https?:\/\//, '')
  return `https://logo.clearbit.com/${clean}`
}

function getChannelIcon(channel: string) {
  switch (channel.toLowerCase()) {
    case 'email': return <Mail className="h-4 w-4" />
    case 'phone': return <Phone className="h-4 w-4" />
    case 'linkedin': return <Linkedin className="h-4 w-4" />
    case 'meeting': return <Calendar className="h-4 w-4" />
    default: return <FileText className="h-4 w-4" />
  }
}

function mapFunctionGroup(group?: string | null) {
  if (!group) return null
  const mappings: Record<string, string> = {
    owner: 'Eigenaar',
    founder: 'Oprichter',
    marketing: 'Marketing',
    sales: 'Sales',
    operations: 'Operationeel',
    hr: 'HR',
    finance: 'Finance',
    it: 'IT',
  }
  return mappings[group.toLowerCase()] || group
}

export default function AccountDetail() {
  const { companyId } = useParams()
  const { profile } = useAuth()
  const [timelineFilter, setTimelineFilter] = useState<string[]>(['email', 'phone', 'linkedin', 'meeting'])
  const [contactSearch, setContactSearch] = useState('')
  const [showAISummaryFull, setShowAISummaryFull] = useState(false)

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => fetchCompany(companyId!),
    enabled: !!companyId,
    staleTime: 60_000,
  })

  const { data: contacts } = useQuery({
    queryKey: ['company-contacts', companyId, profile?.client_id],
    queryFn: () => fetchCompanyContacts(companyId!, profile!.client_id!),
    enabled: !!companyId && !!profile?.client_id,
    staleTime: 60_000,
  })

  const { data: deals } = useQuery({
    queryKey: ['company-deals', companyId],
    queryFn: () => fetchCompanyDeals(companyId!),
    enabled: !!companyId,
    staleTime: 60_000,
  })

  const { data: timeline } = useQuery({
    queryKey: ['company-timeline', companyId],
    queryFn: () => fetchCompanyTimeline(companyId!),
    enabled: !!companyId,
    staleTime: 30_000,
  })

  if (!profile?.client_id) {
    return <div className="p-6 text-center text-muted-foreground">Geen toegang</div>
  }

  if (loadingCompany) {
    return <div className="p-6 text-muted-foreground">Laden…</div>
  }

  if (!company) {
    return <div className="p-6 text-muted-foreground">Account niet gevonden</div>
  }

  const filteredTimeline = timeline?.filter(item => 
    timelineFilter.includes(item.channel.toLowerCase())
  ) || []

  const filteredContacts = contacts?.filter(contact => {
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase()
    const search = contactSearch.toLowerCase()
    return fullName.includes(search) || contact.email?.toLowerCase().includes(search) || contact.job_title?.toLowerCase().includes(search)
  }) || []

  const openDeals = deals?.filter(deal => deal.status === 'open') || []
  const totalPipelineValue = openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-6 py-4">
          {/* Company Hero */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/companies" className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Building2 className="h-5 w-5" />
              </Link>
              
              {company.domain && (
                <img 
                  src={getLogo(company.domain)} 
                  alt="Logo" 
                  className="w-12 h-12 rounded-lg border bg-muted"
                />
              )}
              
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{company.name}</h1>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Actief
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  {company.industry_label && (
                    <span className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" />
                      {company.industry_label}
                    </span>
                  )}
                  {company.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {company.location}
                    </span>
                  )}
                  {company.company_size && (
                    <span className="flex items-center gap-1">
                      <UsersIcon className="h-3.5 w-3.5" />
                      {company.company_size} medewerkers
                    </span>
                  )}
                  {company.website && (
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Globe2 className="h-3.5 w-3.5" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Bel
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                E-mail
              </Button>
              <Button variant="outline" size="sm">
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe deal
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contacten</p>
                  <p className="text-2xl font-bold">{contacts?.length || 0}</p>
                </div>
                <UsersIcon className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open deals</p>
                  <p className="text-2xl font-bold">{openDeals.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pipeline waarde</p>
                  <p className="text-2xl font-bold">€{totalPipelineValue.toLocaleString()}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Laatste interactie</p>
                  <p className="text-sm font-medium">
                    {timeline?.[0] ? new Date(timeline[0].created_at).toLocaleDateString('nl-NL') : '—'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Volgende taak</p>
                  <p className="text-sm font-medium">Geen taken</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-[380px_minmax(0,1fr)_320px] gap-6">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* AI Intelligence Zone */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  AI Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.company_summary && (
                  <div>
                    <h4 className="font-medium mb-2">AI-samenvatting</h4>
                    <ScrollArea className={showAISummaryFull ? "h-auto" : "h-24"}>
                      <p className="text-sm text-muted-foreground leading-relaxed pr-3">
                        {company.company_summary}
                      </p>
                    </ScrollArea>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAISummaryFull(!showAISummaryFull)}
                      className="mt-2 h-auto p-0 text-xs"
                    >
                      {showAISummaryFull ? 'Toon minder' : 'Toon meer'}
                    </Button>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">AI Insights</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Groeiend bedrijf:</strong> 15% toename in personeelsbestand dit jaar
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>Hoge engagement:</strong> Positieve reacties op LinkedIn posts
                      </p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800">
                        <strong>Aanbeveling:</strong> Plan een demo call binnen 2 weken
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    <Plus className="h-4 w-4 mr-2" />
                    Maak aanbevolen taak
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contacten */}
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Contacten ({filteredContacts.length})</CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Zoek contacten..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="h-8"
                />
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {filteredContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <Link to={`/contacts/${contact.id}`} className="font-medium hover:underline">
                            {(contact.first_name || '') + ' ' + (contact.last_name || '')}
                          </Link>
                          <p className="text-xs text-muted-foreground">{contact.job_title || '—'}</p>
                          {contact.function_group && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {mapFunctionGroup(contact.function_group)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Mail className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Linkedin className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Center - Timeline */}
          <div>
            <Card className="rounded-2xl h-[calc(100vh-280px)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    360° Tijdlijn
                  </CardTitle>
                  <div className="flex gap-2">
                    {['email', 'phone', 'linkedin', 'meeting'].map(channel => (
                      <Button
                        key={channel}
                        variant={timelineFilter.includes(channel) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (timelineFilter.includes(channel)) {
                            setTimelineFilter(timelineFilter.filter(f => f !== channel))
                          } else {
                            setTimelineFilter([...timelineFilter, channel])
                          }
                        }}
                        className="h-7"
                      >
                        {getChannelIcon(channel)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-400px)]">
                  {filteredTimeline.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nog geen activiteiten</h3>
                      <p className="text-muted-foreground mb-4">Begin met contact om de tijdlijn te vullen.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTimeline.map((item) => (
                        <div key={item.id} className="flex gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                          <div className={`p-2 rounded-full bg-muted/50 ${
                            item.direction === 'inbound' ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {getChannelIcon(item.channel)}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium capitalize">{item.channel}</span>
                                <Badge variant="outline" className="text-xs">{item.type}</Badge>
                                <span className={`text-xs ${
                                  item.direction === 'inbound' ? 'text-green-600' : 'text-blue-600'
                                }`}>
                                  {item.direction}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.created_at).toLocaleDateString('nl-NL')}
                              </span>
                            </div>
                            {item.content && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.content.length > 150 ? `${item.content.substring(0, 150)}...` : item.content}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Deals */}
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Deals ({deals?.length || 0})</CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {deals?.map((deal) => (
                      <div key={deal.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{deal.title}</h4>
                          <Badge variant={deal.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                            {deal.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>€{deal.value?.toLocaleString() || '0'}</span>
                          <span>{new Date(deal.created_at).toLocaleDateString('nl-NL')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Snelle acties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Plan meeting
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Nieuwe notitie
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Voeg toe aan campagne
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe taak
                </Button>
              </CardContent>
            </Card>

            {/* AI Context */}
            <Card className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">AI Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-2 bg-white/50 rounded">
                    <p className="text-blue-800">
                      <strong>Beste tijd om te bellen:</strong><br />
                      Dinsdag - Donderdag, 10:00-16:00
                    </p>
                  </div>
                  <div className="p-2 bg-white/50 rounded">
                    <p className="text-blue-800">
                      <strong>Laatste interesse:</strong><br />
                      Marketing automation tools
                    </p>
                  </div>
                  <div className="p-2 bg-white/50 rounded">
                    <p className="text-blue-800">
                      <strong>Aanbevolen aanpak:</strong><br />
                      ROI-gerichte presentatie
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
