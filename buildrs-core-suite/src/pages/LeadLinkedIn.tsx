import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useConvexAuth } from '@/hooks/useConvexAuth'
import { useToast } from '@/hooks/use-toast'
import PropositionSelect from '@/components/lead/PropositionSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Linkedin, Calendar, Search, Users, Sparkles, Target, Rocket, TrendingUp, MessageSquare, UserPlus, Activity, Filter, MoreHorizontal, Play, Pause, Settings, Eye, BarChart3 } from 'lucide-react'
import LinkedInStatsGrid from '@/components/linkedin/LinkedInStatsGrid'
import { MultiSelect, type MultiOption } from '@/components/ui/MultiSelect'

export default function LeadLinkedIn() {
  const { user, getClientId } = useConvexAuth()
  // Use real client ID from authenticated user
  const profile = { client_id: getClientId() };
  const { toast } = useToast()
  const navigate = useNavigate()

  const [q, setQ] = useState('')
  const [openNew, setOpenNew] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [processingOpen, setProcessingOpen] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [propositionId, setPropositionId] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState('dashboard')
  const [audFunctions, setAudFunctions] = useState<string[]>([])
  const [audIndustries, setAudIndustries] = useState<string[]>([])
  const [audSubindustries, setAudSubindustries] = useState<string[]>([])
  const [audCountry, setAudCountry] = useState<string[]>([])
  const [audState, setAudState] = useState<string[]>([])
  const [audSizeMin, setAudSizeMin] = useState('')
  const [audSizeMax, setAudSizeMax] = useState('')
  const [dailyCount, setDailyCount] = useState<number>(() => {
    const raw = localStorage.getItem('n8nDailyCountLinkedIn');
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 50;
  })

  // LinkedIn campaigns from Convex
  const campaigns = useQuery(api.campaigns.list, 
    profile?.client_id ? { 
      clientId: profile.client_id as any,
      type: "linkedin" 
    } : "skip"
  )

  // Real aggregated stats from campaigns
  const aggregatedStats = useMemo(() => {
    const campaignList = campaigns ?? []
    
    const stats = campaignList.reduce((acc, campaign) => {
      const stats = campaign?.stats || {}
      return {
        connection_requests_sent: acc.connection_requests_sent + (stats.sent_count || 0),
        new_connections: acc.new_connections + (stats.accepted_count || 0),
        messages_sent: acc.messages_sent + (stats.sent_count || 0),
        replies_received: acc.replies_received + (stats.replied_count || 0),
        meetings_booked: acc.meetings_booked + (stats.booked_count || 0),
        leads_generated: acc.leads_generated + Math.floor((stats.booked_count || 0) * 0.7)
      }
    }, {
      connection_requests_sent: 0,
      new_connections: 0,
      messages_sent: 0,
      replies_received: 0,
      meetings_booked: 0,
      leads_generated: 0
    })
    
    const response_rate = stats.messages_sent > 0 ? 
      Number(((stats.replies_received / stats.messages_sent) * 100).toFixed(1)) : 0
    const connection_rate = stats.connection_requests_sent > 0 ? 
      Number(((stats.new_connections / stats.connection_requests_sent) * 100).toFixed(1)) : 0
    
    return {
      ...stats,
      response_rate,
      connection_rate
    }
  }, [campaigns])

  const industryOptions: MultiOption[] = [
    { label: 'Bouw, Installatie & Techniek', value: 'bouw-installatie' },
    { label: 'Consultancy & Strategie', value: 'consultancy' },
    { label: 'E-commerce & D2C', value: 'ecommerce-d2c' },
    { label: 'Energie & Duurzaamheid', value: 'energie-duurzaam' },
    { label: 'Financiële & Fiscale Dienstverlening', value: 'financieel' },
    { label: 'Hospitality, Events & Toerisme', value: 'hospitality-events' },
    { label: 'HR, Recruitment & Detachering', value: 'hr-recruitment' },
    { label: 'Industrie & Productiebedrijven', value: 'industrie-productie' },
    { label: 'Legal & Advocatuur', value: 'legal' },
    { label: 'Logistiek & Transport', value: 'logistiek-transport' },
    { label: 'Marketing, Branding & Design', value: 'marketing-creatief' },
    { label: 'Onderwijs & Opleidingen', value: 'onderwijs-opleidingen' },
    { label: 'Overheid & Non-profit', value: 'overheid-nonprofit' },
    { label: 'Retail & Groothandel', value: 'retail-groothandel' },
    { label: 'Sales & Leadgeneratie', value: 'sales-leadgen' },
    { label: 'Softwarebedrijven & SaaS', value: 'software-saas' },
    { label: 'Vastgoed & Makelaardij', value: 'vastgoed' },
    { label: 'Zorginstellingen & GGZ', value: 'zorg-ggz' },
  ]
  const functionOptions: MultiOption[] = [
    { label: 'Owner/Founder', value: 'Owner/Founder' },
    { label: 'Marketing Decision Makers', value: 'Marketing Decision Makers' },
    { label: 'Sales Decision Makers', value: 'Sales Decision Makers' },
    { label: 'Business Development Decision Makers', value: 'Business Development Decision Makers' },
    { label: 'Operational Decision Makers', value: 'Operational Decision Makers' },
    { label: 'Technical Decision Makers', value: 'Technical Decision Makers' },
    { label: 'Financial Decision Makers', value: 'Financial Decision Makers' },
    { label: 'HR Decision Makers', value: 'HR Decision Makers' },
    { label: 'Product & Innovation Decision Makers', value: 'Product & Innovation Decision Makers' },
    { label: 'Customer Success & Support Decision Makers', value: 'Customer Success & Support Decision Makers' },
  ]
  const subindustryByParent: Record<string, MultiOption[]> = {
    'bouw-installatie': [
      { label: 'Bouwmaterialen', value: 'bouwmaterialen' },
      { label: 'Duurzame Installaties', value: 'duurzame-installaties' },
      { label: 'Elektrotechnische Installaties', value: 'elektrotechnische-installaties' },
      { label: 'Installatietechniek', value: 'installatietechniek' },
      { label: 'Sanitair', value: 'sanitair' },
    ],
    consultancy: [
      { label: 'Financial Consultancy', value: 'financial-consultancy' },
      { label: 'HR Consultancy', value: 'hr-consultancy' },
      { label: 'IT Consultancy', value: 'it-consultancy' },
      { label: 'Management Consultancy', value: 'management-consultancy' },
      { label: 'Marketing Consultancy', value: 'marketing-consultancy' },
    ],
    'ecommerce-d2c': [
      { label: 'Digital Marketing', value: 'digital-marketing' },
      { label: 'Klantenservice', value: 'klantenservice' },
      { label: 'Logistiek & Fulfilment', value: 'logistiek-en-fulfilment' },
      { label: 'Productontwikkeling', value: 'productontwikkeling' },
      { label: 'Webshops', value: 'webshops' },
    ],
    'energie-duurzaam': [
      { label: 'Duurzame Energie Installaties', value: 'duurzame-energie-installaties' },
      { label: 'Energiebeheer', value: 'energiebeheer' },
      { label: 'Warmtepompen', value: 'warmtepompen' },
      { label: 'Windenergie', value: 'windenergie' },
      { label: 'Zonne-energie', value: 'zonne-energie' },
    ],
    financieel: [
      { label: 'Accountancy', value: 'accountancy' },
      { label: 'Belastingadvies', value: 'belastingadvies' },
      { label: 'Corporate Finance', value: 'corporate-finance' },
      { label: 'Financiële Adviesdiensten', value: 'financiële-adviesdiensten' },
      { label: 'Verzekeringen', value: 'verzekeringen' },
    ],
    'hospitality-events': [
      { label: 'Conferentiecentra', value: 'conferentiecentra' },
      { label: 'Entertainment & Shows', value: 'entertainment' },
      { label: 'Evenementen Marketing', value: 'evenementenmarketing' },
      { label: 'Evenementen Organisatie', value: 'evenementenorganisatie' },
      { label: 'Horeca & Gastvrijheid', value: 'horeca' },
    ],
    'hr-recruitment': [
      { label: 'Detachering & Interim', value: 'detachering-interim' },
      { label: 'Employer Branding', value: 'employer-branding' },
      { label: 'Outplacement & Loopbaanbegeleiding', value: 'outplacement-loopbaan' },
      { label: 'Recruitment Technologie', value: 'recruitment-tech' },
      { label: 'Uitzenden & Flexwerk', value: 'uitzenden-flexwerk' },
      { label: 'Werving & Selectie', value: 'werving-selectie' },
    ],
    'industrie-productie': [
      { label: 'Chemische Industrie', value: 'chemische-industrie' },
      { label: 'Hightech Productie', value: 'hightech-productie' },
      { label: 'Kunststofproductie', value: 'kunststofproductie' },
      { label: 'Maakindustrie', value: 'maakindustrie' },
      { label: 'Machinebouw', value: 'machinebouw' },
      { label: 'Metaalbewerking', value: 'metaalbewerking' },
      { label: 'Voedingsmiddelenindustrie', value: 'voedingsmiddelenindustrie' },
    ],
    legal: [
      { label: 'Advocatenkantoren', value: 'advocatenkantoren' },
      { label: 'Arbeidsrecht & HR-juridisch', value: 'arbeidsrecht-hr' },
      { label: 'Compliance & Privacy', value: 'compliance-privacy' },
      { label: 'Mediation & Conflictoplossing', value: 'mediation-conflictoplossing' },
      { label: 'Notarissen & Vastgoedjuristen', value: 'notarissen-vastgoedjuristen' },
    ],
    'logistiek-transport': [
      { label: 'E-commerce Fulfilment', value: 'ecommerce-fulfilment' },
      { label: 'Internationaal Transport', value: 'internationaal-transport' },
      { label: 'Last Mile & Stadslogistiek', value: 'last-mile-logistiek' },
      { label: 'Logistieke Dienstverlening', value: 'logistieke-dienstverlening' },
      { label: 'Transportbedrijven', value: 'transportbedrijven' },
    ],
    'marketing-creatief': [
      { label: 'Branding & Design', value: 'branding-design' },
      { label: 'Full Service Marketingbureau', value: 'full-service' },
      { label: 'Outbound & Leadgeneratie', value: 'outbound-leadgen' },
      { label: 'Performance Marketing', value: 'performance-marketing' },
      { label: 'SEO & Content Bureaus', value: 'seo-content' },
      { label: 'Social Media Bureaus', value: 'social-media' },
      { label: 'Webdesign & Development', value: 'webdevelopment' },
    ],
    'onderwijs-opleidingen': [
      { label: 'Bedrijfstraining & Coaching', value: 'bedrijfstraining-coaching' },
      { label: 'Online Opleiders & EdTech', value: 'online-opleiders-edtech' },
      { label: 'Scholen & Onderwijsinstellingen', value: 'scholen-onderwijsinstellingen' },
      { label: 'Scholingsadvies & Opleidingsintermediairs', value: 'scholingsadvies-intermediairs' },
      { label: 'Taaltraining & Communicatie', value: 'taaltraining-communicatie' },
      { label: 'Technische & IT-Opleidingen', value: 'technische-it-opleidingen' },
    ],
    'overheid-nonprofit': [
      { label: 'Brancheorganisaties & Verenigingen', value: 'brancheorganisaties-verenigingen' },
      { label: 'Gemeenten & Lokale Overheid', value: 'gemeenten-lokale-overheid' },
      { label: 'Ministeries & Rijksoverheid', value: 'ministeries-rijksoverheid' },
      { label: 'Ondersteunende Publieke Diensten', value: 'ondersteunende-publieke-diensten' },
      { label: 'Stichtingen & Goede Doelen', value: 'stichtingen-goede-doelen' },
    ],
    'retail-groothandel': [
      { label: 'E-commerce Retailers', value: 'e-commerce-retailers' },
      { label: 'Fysieke Retailketens', value: 'fysieke-retailketens' },
      { label: 'Groothandels & Distributeurs', value: 'groothandels-distributeurs' },
      { label: 'Retail Technologie & Services', value: 'retail-technologie-services' },
      { label: 'Specialistische Retail', value: 'specialistische-retail' },
    ],
    'sales-leadgen': [
      { label: 'B2B Leadgeneratie', value: 'b2b-leadgeneratie' },
      { label: 'Cold Calling & Acquisitie', value: 'cold-calling' },
      { label: 'Outbound Leadgeneratie', value: 'outbound-leadgeneratie' },
      { label: 'Sales-as-a-Service', value: 'sales-as-a-service' },
    ],
    'software-saas': [
      { label: 'Branchegerichte SaaS', value: 'vertical-saas' },
      { label: 'Customer Support & CX Software', value: 'customer-support-cx-software' },
      { label: 'E-commerce SaaS Tools', value: 'ecommerce-saas' },
      { label: 'Finance & Accounting Software', value: 'finance-accounting-software' },
      { label: 'HR & Recruitment Software', value: 'hr-recruitment-software' },
      { label: 'Marketing & Sales Software', value: 'marketing-sales-software' },
      { label: 'Operations & Productivity Software', value: 'operations-productivity-software' },
      { label: 'Platform & API-first Tools', value: 'platform-api-tools' },
      { label: 'Projectmanagement & Collaboration', value: 'projectmanagement-tools' },
    ],
    vastgoed: [
      { label: 'Commercieel Vastgoedbeheer', value: 'commercieel-vastgoedbeheer' },
      { label: 'Makelaars & Taxateurs', value: 'makelaars-taxateurs' },
      { label: 'Proptech & Vastgoedsoftware', value: 'proptech-software' },
      { label: 'Vastgoedinvesteringen & Beleggingsfondsen', value: 'vastgoedinvesteringen' },
      { label: 'Vastgoedontwikkeling', value: 'vastgoedontwikkeling' },
      { label: 'Woningverhuur & Beheer', value: 'woningverhuur-beheer' },
    ],
    'zorg-ggz': [
      { label: 'Diagnostiek & Labdiensten', value: 'diagnostiek-labdiensten' },
      { label: 'Huisartsen & Eerstelijnszorg', value: 'huisartsen-eerstelijnszorg' },
      { label: 'Paramedische Praktijken', value: 'paramedische-praktijken' },
      { label: 'Specialistische GGZ & Jeugdzorg', value: 'specialistische-ggz-jeugdzorg' },
      { label: 'Zorginstellingen & Thuiszorg', value: 'zorginstellingen-thuiszorg' },
      { label: 'Zorgsoftware & EPD-leveranciers', value: 'zorgsoftware-epd' },
    ],
  }
  const subLabelByValue = useMemo(() => {
    const map = new Map<string, string>()
    for (const opts of Object.values(subindustryByParent)) for (const o of opts) map.set(o.value, o.label)
    return map
  }, [])
  const subindustryOptionsFiltered: MultiOption[] = useMemo(() => {
    const set = new Map<string, MultiOption>()
    for (const parent of audIndustries) for (const opt of subindustryByParent[parent] || []) set.set(opt.value, opt)
    return Array.from(set.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [audIndustries])
  const countryOptions: MultiOption[] = useMemo(() => {
    try {
      const codes = (Intl as any).supportedValuesOf?.('region') as string[] | undefined
      const regionNames = new (Intl as any).DisplayNames(['nl'], { type: 'region' })
      const list = codes && regionNames ? codes.map(code => ({ value: code, label: regionNames.of(code) || code })) : [
        { label: 'Nederland', value: 'NL' }, { label: 'België', value: 'BE' }, { label: 'Duitsland', value: 'DE' }, { label: 'Frankrijk', value: 'FR' }, { label: 'Verenigd Koninkrijk', value: 'GB' }, { label: 'Verenigde Staten', value: 'US' },
      ]
      return list.sort((a, b) => a.label.localeCompare(b.label))
    } catch {
      return [ { label: 'Nederland', value: 'NL' }, { label: 'België', value: 'BE' }, { label: 'Duitsland', value: 'DE' }, { label: 'Frankrijk', value: 'FR' }, { label: 'Verenigd Koninkrijk', value: 'GB' }, { label: 'Verenigde Staten', value: 'US' } ]
    }
  }, [])
  const countryLabelByValue = useMemo(() => { const m = new Map<string, string>(); for (const o of countryOptions) m.set(o.value, o.label); return m }, [countryOptions])
  const statesByCountry: Record<string, MultiOption[]> = { NL: [ { label: 'Noord-Holland', value: 'noord-holland' }, { label: 'Zuid-Holland', value: 'zuid-holland' }, { label: 'Utrecht', value: 'utrecht' }, { label: 'Noord-Brabant', value: 'noord-brabant' }, { label: 'Gelderland', value: 'gelderland' }, { label: 'Overijssel', value: 'overijssel' }, { label: 'Groningen', value: 'groningen' }, { label: 'Friesland', value: 'friesland' }, { label: 'Drenthe', value: 'drenthe' }, { label: 'Flevoland', value: 'flevoland' }, { label: 'Zeeland', value: 'zeeland' }, { label: 'Limburg', value: 'limburg' } ], BE: [ { label: 'Antwerpen', value: 'antwerpen' }, { label: 'Oost-Vlaanderen', value: 'oost-vlaanderen' }, { label: 'West-Vlaanderen', value: 'west-vlaanderen' }, { label: 'Vlaams-Brabant', value: 'vlaams-brabant' }, { label: 'Limburg', value: 'limburg-be' }, { label: 'Brussel Hoofdstedelijk Gewest', value: 'brussel' }, { label: 'Henegouwen', value: 'henegouwen' }, { label: 'Luik', value: 'luik' }, { label: 'Luxemburg', value: 'luxemburg' }, { label: 'Namen', value: 'namen' } ], DE: [ { label: 'Bayern', value: 'bayern' }, { label: 'Berlin', value: 'berlin' } ], FR: [ { label: 'Île-de-France', value: 'idf' }, { label: 'Provence-Alpes-Côte d’Azur', value: 'paca' } ], GB: [ { label: 'England', value: 'england' }, { label: 'Scotland', value: 'scotland' }, { label: 'Wales', value: 'wales' } ], US: [ { label: 'California', value: 'california' }, { label: 'New York', value: 'new-york' } ] }
  const stateLabelByValue = useMemo(() => { const m = new Map<string, string>(); for (const list of Object.values(statesByCountry)) for (const o of list) m.set(o.value, o.label); return m }, [])
  const stateOptionsFiltered: MultiOption[] = useMemo(() => { const set = new Map<string, MultiOption>(); for (const c of audCountry) for (const s of statesByCountry[c] || []) set.set(s.value, s); return Array.from(set.values()).sort((a, b) => a.label.localeCompare(b.label)) }, [audCountry])

  const createCampaign = useMutation(api.campaigns.create)

  const handleCreateCampaign = async () => {
    try {
      if (!name.trim()) throw new Error('Naam is verplicht')
      if (!propositionId) throw new Error('Propositie is verplicht')
      if (!profile?.client_id) throw new Error('Client ID is vereist')
      
      const company_size_min = audSizeMin.trim() ? Number(audSizeMin) : undefined
      const company_size_max = audSizeMax.trim() ? Number(audSizeMax) : undefined
      
      if ((audSizeMin && Number.isNaN(company_size_min)) || (audSizeMax && Number.isNaN(company_size_max))) {
        throw new Error('Bedrijfsgrootte moet een nummer zijn')
      }
      
      const hasAny = audFunctions.length > 0 || audIndustries.length > 0 || audSubindustries.length > 0 || audCountry.length > 0 || audState.length > 0 || company_size_min !== undefined || company_size_max !== undefined
      if (!hasAny) throw new Error('Audience filter is verplicht: vul minimaal één targetingveld in')

      setProcessingOpen(true)
      const started = Date.now()
      const total = 8000
      const interval = window.setInterval(() => {
        const elapsed = Date.now() - started
        const pct = Math.max(5, Math.min(99, Math.round((elapsed / total) * 100)))
        setProcessingProgress(pct)
      }, 200)
      
      const campaignData = {
        name: name.trim(),
        description: description.trim() || undefined,
        status: 'draft' as const,
        type: 'linkedin' as const,
        clientId: profile.client_id as any,
        propositionId: propositionId as any,
        targetingCriteria: {
          functionGroups: audFunctions,
          industries: audIndustries,
          subindustries: audSubindustries,
          countries: audCountry,
          states: audState,
          companySizeMin: company_size_min,
          companySizeMax: company_size_max
        },
        settings: {
          dailyConnectLimit: dailyCount,
          dailyMessageLimit: 100
        }
      }
      
      const campaignId = await createCampaign(campaignData)
      
      const finish = () => {
        setProcessingProgress(100)
        window.clearInterval(interval)
        setTimeout(() => {
          setProcessingOpen(false)
          setOpenNew(false)
          setName('')
          setDescription('')
          setAudFunctions([]); setAudIndustries([]); setAudSubindustries([]); setAudCountry([]); setAudState([]); setAudSizeMin(''); setAudSizeMax('')
          setPropositionId(null)
          
          toast({ 
            title: 'LinkedIn Campaign Created', 
            description: 'Your campaign is ready to be configured and launched.' 
          })
          
          if (campaignId) navigate(`/lead-engine/linkedin/${campaignId}`)
        }, 500)
      }
      
      setTimeout(finish, total)
    } catch (error: any) {
      setProcessingOpen(false)
      toast({ title: 'Mislukt', description: error?.message ?? 'Onbekende fout' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Modern Header - Exact ABM style */}
      <div className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-40 -ml-6 w-[102.5%] -mt-6">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                LinkedIn Campaigns
              </h1>
              <p className="text-slate-600 mt-1 font-medium">
                Automated LinkedIn outreach en verbinding beheer
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Zoek campagnes, doelgroepen..."
                  className="pl-10 w-80 h-11 bg-white/60 border-slate-200 focus:bg-white"
                />
              </div>
              <Dialog open={openNew} onOpenChange={setOpenNew}>
                <DialogTrigger asChild>
                  <Button 
                    className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nieuwe Campagne
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl w-full h-[90vh] bg-background/95 backdrop-blur-xl border-0 shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 pb-6">
              <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-white">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Linkedin className="w-5 h-5 text-white" />
                </div>
                Nieuwe LinkedIn Campagne
              </DialogTitle>
              <p className="text-blue-100 mt-2">Creëer een nieuwe LinkedIn outreach campagne om je doelgroep te bereiken</p>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-250px)] pr-6">
              <div className="space-y-8 px-8 py-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <label className="text-sm font-medium">Campagnenaam *</label>
                  </div>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Geef je campagne een herkenbare naam..." className="h-11" />
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <label className="text-sm font-medium">Audience (verplicht)</label>
                  </div>
                  <p className="text-xs text-muted-foreground">Vul minimaal één targetingveld in. Kies industrie en subindustrie uit de lijsten; meerdere selecties mogelijk. Vul bedrijfsgrootte (min/max) als getal.</p>
                  <div className="space-y-3">
                    <label className="text-sm text-muted-foreground">Functies</label>
                    <div className="min-h-[44px]"><MultiSelect options={functionOptions} value={audFunctions} onChange={setAudFunctions} placeholder="Kies 1 of meer functies" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3"><label className="text-sm text-muted-foreground">Industrie</label><div className="min-h-[44px]"><MultiSelect options={industryOptions} value={audIndustries} onChange={setAudIndustries} placeholder="Kies 1 of meer industrieën" /></div></div>
                    <div className="space-y-3"><label className="text-sm text-muted-foreground">Subindustrie</label><div className="min-h-[44px]"><MultiSelect options={subindustryOptionsFiltered} value={audSubindustries} onChange={setAudSubindustries} placeholder={audIndustries.length ? 'Kies 1 of meer subindustrieën' : 'Kies eerst industrie(en)'} disabled={audIndustries.length === 0} /></div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3"><label className="text-sm text-muted-foreground">Land</label><div className="min-h-[44px]"><MultiSelect options={countryOptions} value={audCountry} onChange={v => { setAudCountry(v); setAudState([]) }} placeholder="Kies 1 of meer landen" /></div></div>
                    <div className="space-y-3"><label className="text-sm text-muted-foreground">Provincie</label><div className="min-h-[44px]"><MultiSelect options={stateOptionsFiltered} value={audState} onChange={setAudState} placeholder={audCountry.length ? 'Kies 1 of meer provincies' : 'Kies eerst land(en)'} disabled={audCountry.length === 0} /></div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3"><label className="text-sm text-muted-foreground">Company size min</label><Input type="number" inputMode="numeric" placeholder="10" value={audSizeMin} onChange={e => setAudSizeMin(e.target.value)} className="h-11" /></div>
                    <div className="space-y-3"><label className="text-sm text-muted-foreground">Company size max</label><Input type="number" inputMode="numeric" placeholder="500" value={audSizeMax} onChange={e => setAudSizeMax(e.target.value)} className="h-11" /></div>
                  </div>
                  <div className="space-y-3"><label className="text-sm font-medium">Propositie {propositionId ? '' : <span className="text-red-600">*</span>}</label><PropositionSelect value={propositionId || undefined} onChange={id => setPropositionId(id)} />{!propositionId && (<p className="text-xs text-red-600">Propositie is verplicht.</p>)}</div>
                </div>
                <div className="space-y-4"><div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-600" /><label className="text-sm font-medium">Campagne Omschrijving</label></div><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Beschrijf het doel en de strategie van je campagne..." rows={4} className="resize-none" /></div>
                <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg border border-blue-200/40 dark:border-blue-800/40"><div className="flex items-start gap-3"><div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex-shrink-0"><Rocket className="w-4 h-4 text-white" /></div><div className="flex-1 min-w-0"><h4 className="font-medium text-sm mb-2">Volgende Stappen</h4><p className="text-sm text-muted-foreground mb-3 leading-relaxed">Na het aanmaken kun je direct de propositie koppelen, doelgroep definiëren en je LinkedIn sequence opstellen.</p><div className="flex flex-wrap gap-2"><Badge variant="secondary" className="text-xs">Propositie koppelen</Badge><Badge variant="secondary" className="text-xs">Doelgroep selecteren</Badge><Badge variant="secondary" className="text-xs">Sequence</Badge></div></div></div></div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-8 pt-4 gap-3 bg-gray-50/50 dark:bg-slate-900/50 border-t">
              <Button variant="outline" onClick={() => setOpenNew(false)} className="min-w-[120px]">
                Annuleren
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={processingOpen || !name.trim() || !propositionId}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white min-w-[180px]"
              >
                {processingOpen ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Aanmaken...
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Campagne Aanmaken
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="px-8">
            <TabsList className="h-12 bg-slate-100 p-1">
              <TabsTrigger value="dashboard" className="h-10 px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Target className="w-4 h-4 mr-2" />
                Campagnes
              </TabsTrigger>
              <TabsTrigger value="analytics" className="h-10 px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="h-10 px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Settings className="w-4 h-4 mr-2" />
                Instellingen
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      <div className="py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsContent value="dashboard" className="space-y-8">
            {/* KPI Cards */}
            <div className="px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-blue-100 font-medium text-sm">Connection Requests</span>
                      <UserPlus className="w-4 h-4 text-blue-200" />
                    </div>
                    <div className="text-2xl font-bold">{aggregatedStats.connection_requests_sent.toLocaleString()}</div>
                    <p className="text-blue-200 text-xs">{aggregatedStats.new_connections} geaccepteerd</p>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-emerald-100 font-medium text-sm">Nieuwe Connecties</span>
                      <Users className="w-4 h-4 text-emerald-200" />
                    </div>
                    <div className="text-2xl font-bold">{aggregatedStats.new_connections.toLocaleString()}</div>
                    <p className="text-emerald-200 text-xs">{aggregatedStats.connection_rate}% acceptatie</p>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-orange-100 font-medium text-sm">Reacties Ontvangen</span>
                      <MessageSquare className="w-4 h-4 text-orange-200" />
                    </div>
                    <div className="text-2xl font-bold">{aggregatedStats.replies_received.toLocaleString()}</div>
                    <p className="text-orange-200 text-xs">{aggregatedStats.response_rate}% reactiepercentage</p>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-purple-100 font-medium text-sm">Meetings Geboekt</span>
                      <Calendar className="w-4 h-4 text-purple-200" />
                    </div>
                    <div className="text-2xl font-bold">{aggregatedStats.meetings_booked.toLocaleString()}</div>
                    <p className="text-purple-200 text-xs">{aggregatedStats.leads_generated} leads gegenereerd</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Active Campaigns */}
            <div className="px-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Actieve Campagnes</h2>
                  <p className="text-slate-600">Lopende LinkedIn outreach campagnes</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filteren
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Exporteren
                  </Button>
                </div>
              </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              className="pl-10 h-11" 
              placeholder="Search campaigns..." 
              value={q} 
              onChange={e => setQ(e.target.value)} 
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-2">
              <Activity className="w-3 h-3" />
              {(campaigns ?? []).length} Campaigns
            </Badge>
          </div>
        </div>

        {/* Enhanced Campaign Cards */}
        {campaigns === undefined ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="apple-card animate-pulse">
                <CardContent className="p-6 h-48" />
              </Card>
            ))}
          </div>
        ) : (campaigns ?? []).length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Linkedin className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">Create your first LinkedIn campaign to start generating leads</p>
            <Button onClick={() => setOpenNew(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {(campaigns ?? []).map((campaign: any) => {
              const metrics = campaign.linkedin_metrics || {}
              const isActive = campaign.status === 'active'
              
              return (
                <Card key={campaign.id} className="apple-card hover:apple-card-hover cursor-pointer group" onClick={() => navigate(`/lead-engine/linkedin/${campaign.id}`)}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                          {campaign.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {campaign.description || 'LinkedIn outreach campaign'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isActive ? 'default' : 'secondary'} className="capitalize text-xs">
                          {campaign.status || 'draft'}
                        </Badge>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-muted-foreground">Connections</span>
                        </div>
                        <p className="text-lg font-semibold">{metrics.new_connections || 0}</p>
                        <p className="text-xs text-muted-foreground">
                          {metrics.connection_acceptance_rate || 0}% rate
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-3 h-3 text-purple-500" />
                          <span className="text-xs text-muted-foreground">Replies</span>
                        </div>
                        <p className="text-lg font-semibold">{metrics.replies_received || 0}</p>
                        <p className="text-xs text-muted-foreground">
                          {metrics.response_rate || 0}% rate
                        </p>
                      </div>
                    </div>
                    
                    {/* Bottom Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{metrics.meetings_booked || 0} meetings</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>{metrics.leads_generated || 0} leads</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Activity className="w-3 h-3" />
                        <span>
                          {metrics.last_activity_at ? 
                            new Date(metrics.last_activity_at).toLocaleDateString() : 
                            'No activity'
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
        
        {/* Processing modal */}
        <Dialog open={processingOpen}>
          <DialogContent className="max-w-lg p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <DialogTitle className="text-white">Setting up your LinkedIn campaign</DialogTitle>
              <p className="text-blue-100 mt-1">Configuring audience targeting and campaign settings...</p>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-5 h-5 border-2 border-white/30 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground">Preparing campaign structure...</p>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600 transition-all" style={{ width: `${processingProgress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Almost done. This will close automatically when ready.</p>
            </div>
          </DialogContent>
        </Dialog>

            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-8">
            <div className="px-8">
              <div className="text-center py-16">
                <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Analytics komen binnenkort</h3>
                <p className="text-muted-foreground">Uitgebreide analytics en rapportages worden binnenkort beschikbaar.</p>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-8">
            <div className="px-8">
              <div className="text-center py-16">
                <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Settings className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Instellingen komen binnenkort</h3>
                <p className="text-muted-foreground">Campagne instellingen en automatiseringen worden binnenkort beschikbaar.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

