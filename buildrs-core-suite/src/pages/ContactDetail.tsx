import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Phone, Mail, Linkedin, Building2, MapPin, Activity as ActivityIcon, NotebookText, Briefcase, CalendarClock, User, Plus, Filter } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'

// Simplified type to match what we actually fetch
type ContactWithRelations = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  mobile_phone: string | null
  linkedin_url: string | null
  job_title: string | null
  function_group: string | null
  status: string | null
  tags: string[] | null
  company_id: string | null
  client_id: string | null
  created_at: string | null
  companies: {
    name: string | null
    domain: string | null
  } | null
}

export default function ContactDetail() {
  const { id, contactId } = useParams<{ id?: string; contactId?: string }>()
  const resolvedId = contactId || id
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: contact, isLoading, error } = useQuery({
    queryKey: ['contact', resolvedId],
    queryFn: async () => {
      if (!resolvedId) throw new Error('No contact ID provided')
      
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          first_name,
          last_name,
          email,
          mobile_phone,
          linkedin_url,
          job_title,
          function_group,
          status,
          tags,
          company_id,
          client_id,
          created_at,
          companies (
            name,
            domain
          )
        `)
        .eq('id', resolvedId)
        .single()

      if (error) throw error
      return data as ContactWithRelations
    },
    enabled: !!resolvedId,
  })

  const { data: deals } = useQuery({
    queryKey: ['contact-deals', resolvedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('id,title,value,stage_id,status,created_at')
        .eq('contact_id', resolvedId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!resolvedId,
    staleTime: 60_000,
  })

  const { data: activities } = useQuery({
    queryKey: ['contact-activity', resolvedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, action, description, created_at, deal_id, company_id')
        .eq('contact_id', resolvedId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!resolvedId,
    staleTime: 30_000,
  })

  const { data: notes } = useQuery({
    queryKey: ['contact-notes', resolvedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('id, notes, created_at')
        .eq('contact_id', resolvedId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!resolvedId,
    staleTime: 60_000,
  })

  // Optional tasks query (if table exists)
  const { data: tasks } = useQuery({
    queryKey: ['contact-tasks', resolvedId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, status, due_date, created_at')
          .eq('contact_id', resolvedId)
          .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
      } catch {
        return []
      }
    },
    enabled: !!resolvedId,
    staleTime: 60_000,
  })

  const emailDomain = contact?.email?.split('@')[1] || contact?.companies?.domain || null
  const avatarUrl = emailDomain ? `https://logo.clearbit.com/${emailDomain}` : null

  // Tabs state
  const [activeTab, setActiveTab] = React.useState<'activity' | 'notes' | 'emails' | 'calls' | 'tasks' | 'meetings'>('activity')
  const filteredActivities = (activities || []).filter(a => {
    if (activeTab === 'activity') return true
    const t = String(a.action || '').toLowerCase()
    if (activeTab === 'emails') return t.includes('email')
    if (activeTab === 'calls') return t.includes('call') || t.includes('bel')
    if (activeTab === 'meetings') return t.includes('meeting')
    if (activeTab === 'tasks') return t.includes('task')
    return true
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Contact niet gevonden
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      {/* Top bar */}
      <div className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug
            </Button>
            <div>
              <div className="text-xl font-semibold">
                {contact.first_name} {contact.last_name}
              </div>
              <div className="text-sm text-muted-foreground">
                {contact.job_title} {contact.companies?.name ? `· ${contact.companies.name}` : ''}
              </div>
            </div>
            {contact.status && (
              <Badge variant="secondary" className="ml-2 capitalize">{contact.status}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {contact.email && (
              <Button variant="outline" size="sm"><Mail className="w-4 h-4 mr-2" />E‑mail</Button>
            )}
            {contact.mobile_phone && (
              <Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-2" />Bellen</Button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto flex-1 overflow-auto p-4">
        {/* Tabs like HubSpot */}
        <div className="mb-3 flex items-center gap-2">
          {([
            { key: 'activity', label: 'Overzicht' },
            { key: 'notes', label: 'Notities' },
            { key: 'emails', label: 'E-mails' },
            { key: 'calls', label: 'Calls' },
            { key: 'tasks', label: 'Tasks' },
            { key: 'meetings', label: 'Meetings' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === t.key ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline"><Filter className="w-4 h-4 mr-2" />Filter</Button>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Nieuwe activiteit</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Center: Activities / Notes */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><ActivityIcon className="w-4 h-4" />Activiteiten</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredActivities && filteredActivities.length > 0 ? (
                  <div className="space-y-4">
                    {filteredActivities.map((a: any) => (
                      <div key={a.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <ActivityIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm">{a.action}</div>
                          {a.description && <div className="text-xs text-muted-foreground">{a.description}</div>}
                          <div className="text-[11px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Geen activiteiten.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><NotebookText className="w-4 h-4" />Notities</CardTitle>
              </CardHeader>
              <CardContent>
                {notes && notes.length > 0 ? (
                  <div className="space-y-4">
                    {notes.map((n: any) => (
                      <div key={n.id} className="p-3 rounded-md border">
                        <div className="text-sm whitespace-pre-wrap">{n.notes}</div>
                        <div className="text-[11px] text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Geen notities.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Summary & Deals */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Over dit contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                    <div className="text-xs text-muted-foreground">{contact.job_title || '—'}</div>
                  </div>
                </div>
                {/* duidelijke link naar accountdetails */}
                {contact.companies?.name && contact.company_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <a href={`/accounts/${contact.company_id}`} className="underline underline-offset-2">{contact.companies.name}</a>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /><a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a></div>
                )}
                {contact.mobile_phone && (
                  <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><a href={`tel:${contact.mobile_phone}`} className="hover:underline">{contact.mobile_phone}</a></div>
                )}
                {contact.linkedin_url && (
                  <div className="flex items-center gap-2 text-sm"><Linkedin className="w-4 h-4 text-muted-foreground" /><a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a></div>
                )}
                {/* extra context */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <div className="text-muted-foreground">Functie groep</div>
                  <div className="text-right">{contact.function_group || '—'}</div>
                  <div className="text-muted-foreground">Client</div>
                  <div className="text-right">{contact.client_id || '—'}</div>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1"><CalendarClock className="w-3 h-3" />Aangemaakt op {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : '—'}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-4 h-4" />Deals</CardTitle>
              </CardHeader>
              <CardContent>
                {deals && deals.length > 0 ? (
                  <div className="space-y-2">
                    {deals.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between p-2 rounded-md border">
                        <div className="text-sm font-medium truncate mr-2">{d.title}</div>
                        <div className="text-sm text-muted-foreground">€{Number(d.value || 0).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Geen deals gekoppeld.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
