import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiSelect, MultiOption } from '@/components/ui/MultiSelect';
import PropositionSelect from '@/components/lead/PropositionSelect';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Play, PauseCircle, StopCircle, Mail, Target, BarChart3 } from 'lucide-react';

// Industry options
const industryOptions: MultiOption[] = [{
  value: 'technology',
  label: 'Technologie'
}, {
  value: 'healthcare',
  label: 'Zorgverlening'
}, {
  value: 'finance',
  label: 'Financiële dienstverlening'
}, {
  value: 'education',
  label: 'Onderwijs'
}, {
  value: 'retail',
  label: 'Retail'
}, {
  value: 'manufacturing',
  label: 'Productie'
}, {
  value: 'consulting',
  label: 'Consultancy'
}, {
  value: 'real_estate',
  label: 'Vastgoed'
}, {
  value: 'construction',
  label: 'Bouw'
}, {
  value: 'automotive',
  label: 'Automotive'
}, {
  value: 'food_beverage',
  label: 'Voeding & Dranken'
}, {
  value: 'energy',
  label: 'Energie'
}, {
  value: 'logistics',
  label: 'Logistiek'
}, {
  value: 'media',
  label: 'Media & Entertainment'
}, {
  value: 'non_profit',
  label: 'Non-profit'
}, {
  value: 'government',
  label: 'Overheid'
}, {
  value: 'agriculture',
  label: 'Landbouw'
}, {
  value: 'tourism',
  label: 'Toerisme'
}, {
  value: 'legal',
  label: 'Juridische diensten'
}, {
  value: 'other',
  label: 'Overig'
}];

// Company size options
const companySizeOptions: MultiOption[] = [{
  value: '1-10',
  label: '1-10 medewerkers'
}, {
  value: '11-50',
  label: '11-50 medewerkers'
}, {
  value: '51-200',
  label: '51-200 medewerkers'
}, {
  value: '201-500',
  label: '201-500 medewerkers'
}, {
  value: '501-1000',
  label: '501-1000 medewerkers'
}, {
  value: '1001-5000',
  label: '1001-5000 medewerkers'
}, {
  value: '5000+',
  label: '5000+ medewerkers'
}];

// Location options (Netherlands focus)
const locationOptions: MultiOption[] = [{
  value: 'amsterdam',
  label: 'Amsterdam'
}, {
  value: 'rotterdam',
  label: 'Rotterdam'
}, {
  value: 'the_hague',
  label: 'Den Haag'
}, {
  value: 'utrecht',
  label: 'Utrecht'
}, {
  value: 'eindhoven',
  label: 'Eindhoven'
}, {
  value: 'groningen',
  label: 'Groningen'
}, {
  value: 'tilburg',
  label: 'Tilburg'
}, {
  value: 'almere',
  label: 'Almere'
}, {
  value: 'breda',
  label: 'Breda'
}, {
  value: 'nijmegen',
  label: 'Nijmegen'
}, {
  value: 'north_holland',
  label: 'Noord-Holland'
}, {
  value: 'south_holland',
  label: 'Zuid-Holland'
}, {
  value: 'north_brabant',
  label: 'Noord-Brabant'
}, {
  value: 'gelderland',
  label: 'Gelderland'
}, {
  value: 'utrecht_province',
  label: 'Utrecht (provincie)'
}, {
  value: 'limburg',
  label: 'Limburg'
}, {
  value: 'overijssel',
  label: 'Overijssel'
}, {
  value: 'groningen_province',
  label: 'Groningen (provincie)'
}, {
  value: 'friesland',
  label: 'Friesland'
}, {
  value: 'drenthe',
  label: 'Drenthe'
}, {
  value: 'flevoland',
  label: 'Flevoland'
}, {
  value: 'zeeland',
  label: 'Zeeland'
}, {
  value: 'netherlands',
  label: 'Heel Nederland'
}];

// Function options (match creation modal)
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
];

// Industry options (match creation modal)
const creationIndustryOptions: MultiOption[] = [
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
];

// Subindustry mapping (parent slug -> options with labels). Values are labels to match stored DB values
const subindustryByParent: Record<string, MultiOption[]> = {
  'bouw-installatie': [
    { label: 'Bouwmaterialen', value: 'Bouwmaterialen' },
    { label: 'Duurzame Installaties', value: 'Duurzame Installaties' },
    { label: 'Elektrotechnische Installaties', value: 'Elektrotechnische Installaties' },
    { label: 'Installatietechniek', value: 'Installatietechniek' },
    { label: 'Sanitair', value: 'Sanitair' },
  ],
  consultancy: [
    { label: 'Financial Consultancy', value: 'Financial Consultancy' },
    { label: 'HR Consultancy', value: 'HR Consultancy' },
    { label: 'IT Consultancy', value: 'IT Consultancy' },
    { label: 'Management Consultancy', value: 'Management Consultancy' },
    { label: 'Marketing Consultancy', value: 'Marketing Consultancy' },
  ],
  'ecommerce-d2c': [
    { label: 'Digital Marketing', value: 'Digital Marketing' },
    { label: 'Klantenservice', value: 'Klantenservice' },
    { label: 'Logistiek & Fulfilment', value: 'Logistiek & Fulfilment' },
    { label: 'Productontwikkeling', value: 'Productontwikkeling' },
    { label: 'Webshops', value: 'Webshops' },
  ],
  'energie-duurzaam': [
    { label: 'Duurzame Energie Installaties', value: 'Duurzame Energie Installaties' },
    { label: 'Energiebeheer', value: 'Energiebeheer' },
    { label: 'Warmtepompen', value: 'Warmtepompen' },
    { label: 'Windenergie', value: 'Windenergie' },
    { label: 'Zonne-energie', value: 'Zonne-energie' },
  ],
  financieel: [
    { label: 'Accountancy', value: 'Accountancy' },
    { label: 'Belastingadvies', value: 'Belastingadvies' },
    { label: 'Corporate Finance', value: 'Corporate Finance' },
    { label: 'Financiële Adviesdiensten', value: 'Financiële Adviesdiensten' },
    { label: 'Verzekeringen', value: 'Verzekeringen' },
  ],
  'hospitality-events': [
    { label: 'Conferentiecentra', value: 'Conferentiecentra' },
    { label: 'Entertainment & Shows', value: 'Entertainment & Shows' },
    { label: 'Evenementen Marketing', value: 'Evenementen Marketing' },
    { label: 'Evenementen Organisatie', value: 'Evenementen Organisatie' },
    { label: 'Horeca & Gastvrijheid', value: 'Horeca & Gastvrijheid' },
  ],
  'hr-recruitment': [
    { label: 'Detachering & Interim', value: 'Detachering & Interim' },
    { label: 'Employer Branding', value: 'Employer Branding' },
    { label: 'Outplacement & Loopbaanbegeleiding', value: 'Outplacement & Loopbaanbegeleiding' },
    { label: 'Recruitment Technologie', value: 'Recruitment Technologie' },
    { label: 'Uitzenden & Flexwerk', value: 'Uitzenden & Flexwerk' },
    { label: 'Werving & Selectie', value: 'Werving & Selectie' },
  ],
  'industrie-productie': [
    { label: 'Chemische Industrie', value: 'Chemische Industrie' },
    { label: 'Hightech Productie', value: 'Hightech Productie' },
    { label: 'Kunststofproductie', value: 'Kunststofproductie' },
    { label: 'Maakindustrie', value: 'Maakindustrie' },
    { label: 'Machinebouw', value: 'Machinebouw' },
    { label: 'Metaalbewerking', value: 'Metaalbewerking' },
    { label: 'Voedingsmiddelenindustrie', value: 'Voedingsmiddelenindustrie' },
  ],
  legal: [
    { label: 'Advocatenkantoren', value: 'Advocatenkantoren' },
    { label: 'Arbeidsrecht & HR-juridisch', value: 'Arbeidsrecht & HR-juridisch' },
    { label: 'Compliance & Privacy', value: 'Compliance & Privacy' },
    { label: 'Mediation & Conflictoplossing', value: 'Mediation & Conflictoplossing' },
    { label: 'Notarissen & Vastgoedjuristen', value: 'Notarissen & Vastgoedjuristen' },
  ],
  'logistiek-transport': [
    { label: 'E-commerce Fulfilment', value: 'E-commerce Fulfilment' },
    { label: 'Internationaal Transport', value: 'Internationaal Transport' },
    { label: 'Last Mile & Stadslogistiek', value: 'Last Mile & Stadslogistiek' },
    { label: 'Logistieke Dienstverlening', value: 'Logistieke Dienstverlening' },
    { label: 'Transportbedrijven', value: 'Transportbedrijven' },
  ],
  'marketing-creatief': [
    { label: 'Branding & Design', value: 'Branding & Design' },
    { label: 'Full Service Marketingbureau', value: 'Full Service Marketingbureau' },
    { label: 'Outbound & Leadgeneratie', value: 'Outbound & Leadgeneratie' },
    { label: 'Performance Marketing', value: 'Performance Marketing' },
    { label: 'SEO & Content Bureaus', value: 'SEO & Content Bureaus' },
    { label: 'Social Media Bureaus', value: 'Social Media Bureaus' },
    { label: 'Webdesign & Development', value: 'Webdesign & Development' },
  ],
  'onderwijs-opleidingen': [
    { label: 'Bedrijfstraining & Coaching', value: 'Bedrijfstraining & Coaching' },
    { label: 'Online Opleiders & EdTech', value: 'Online Opleiders & EdTech' },
    { label: 'Scholen & Onderwijsinstellingen', value: 'Scholen & Onderwijsinstellingen' },
    { label: 'Scholingsadvies & Opleidingsintermediairs', value: 'Scholingsadvies & Opleidingsintermediairs' },
    { label: 'Taaltraining & Communicatie', value: 'Taaltraining & Communicatie' },
    { label: 'Technische & IT-Opleidingen', value: 'Technische & IT-Opleidingen' },
  ],
  'overheid-nonprofit': [
    { label: 'Brancheorganisaties & Verenigingen', value: 'Brancheorganisaties & Verenigingen' },
    { label: 'Gemeenten & Lokale Overheid', value: 'Gemeenten & Lokale Overheid' },
    { label: 'Ministeries & Rijksoverheid', value: 'Ministeries & Rijksoverheid' },
    { label: 'Ondersteunende Publieke Diensten', value: 'Ondersteunende Publieke Diensten' },
    { label: 'Stichtingen & Goede Doelen', value: 'Stichtingen & Goede Doelen' },
  ],
  'retail-groothandel': [
    { label: 'E-commerce Retailers', value: 'E-commerce Retailers' },
    { label: 'Fysieke Retailketens', value: 'Fysieke Retailketens' },
    { label: 'Groothandels & Distributeurs', value: 'Groothandels & Distributeurs' },
    { label: 'Retail Technologie & Services', value: 'Retail Technologie & Services' },
    { label: 'Specialistische Retail', value: 'Specialistische Retail' },
  ],
  'sales-leadgen': [
    { label: 'B2B Leadgeneratie', value: 'B2B Leadgeneratie' },
    { label: 'Cold Calling & Acquisitie', value: 'Cold Calling & Acquisitie' },
    { label: 'Outbound Leadgeneratie', value: 'Outbound Leadgeneratie' },
    { label: 'Sales-as-a-Service', value: 'Sales-as-a-Service' },
  ],
  'software-saas': [
    { label: 'Branchegerichte SaaS', value: 'Branchegerichte SaaS' },
    { label: 'Customer Support & CX Software', value: 'Customer Support & CX Software' },
    { label: 'E-commerce SaaS Tools', value: 'E-commerce SaaS Tools' },
    { label: 'Finance & Accounting Software', value: 'Finance & Accounting Software' },
    { label: 'HR & Recruitment Software', value: 'HR & Recruitment Software' },
    { label: 'Marketing & Sales Software', value: 'Marketing & Sales Software' },
    { label: 'Operations & Productivity Software', value: 'Operations & Productivity Software' },
    { label: 'Platform & API-first Tools', value: 'Platform & API-first Tools' },
    { label: 'Projectmanagement & Collaboration', value: 'Projectmanagement & Collaboration' },
  ],
  vastgoed: [
    { label: 'Commercieel Vastgoedbeheer', value: 'Commercieel Vastgoedbeheer' },
    { label: 'Makelaars & Taxateurs', value: 'Makelaars & Taxateurs' },
    { label: 'Proptech & Vastgoedsoftware', value: 'Proptech & Vastgoedsoftware' },
    { label: 'Vastgoedinvesteringen & Beleggingsfondsen', value: 'Vastgoedinvesteringen & Beleggingsfondsen' },
    { label: 'Vastgoedontwikkeling', value: 'Vastgoedontwikkeling' },
    { label: 'Woningverhuur & Beheer', value: 'Woningverhuur & Beheer' },
  ],
  'zorg-ggz': [
    { label: 'Diagnostiek & Labdiensten', value: 'Diagnostiek & Labdiensten' },
    { label: 'Huisartsen & Eerstelijnszorg', value: 'Huisartsen & Eerstelijnszorg' },
    { label: 'Paramedische Praktijken', value: 'Paramedische Praktijken' },
    { label: 'Specialistische GGZ & Jeugdzorg', value: 'Specialistische GGZ & Jeugdzorg' },
    { label: 'Zorginstellingen & Thuiszorg', value: 'Zorginstellingen & Thuiszorg' },
    { label: 'Zorgsoftware & EPD-leveranciers', value: 'Zorgsoftware & EPD-leveranciers' },
  ],
};

// States per country (labels to labels)
const statesByCountry: Record<string, MultiOption[]> = {
  Nederland: [
    { label: 'Noord-Holland', value: 'Noord-Holland' },
    { label: 'Zuid-Holland', value: 'Zuid-Holland' },
    { label: 'Utrecht', value: 'Utrecht' },
    { label: 'Noord-Brabant', value: 'Noord-Brabant' },
    { label: 'Gelderland', value: 'Gelderland' },
  ],
  België: [
    { label: 'Antwerpen', value: 'Antwerpen' },
    { label: 'Oost-Vlaanderen', value: 'Oost-Vlaanderen' },
    { label: 'West-Vlaanderen', value: 'West-Vlaanderen' },
  ],
  Duitsland: [
    { label: 'Bayern', value: 'Bayern' },
    { label: 'Berlin', value: 'Berlin' },
  ],
  Frankrijk: [
    { label: 'Île-de-France', value: 'Île-de-France' },
  ],
  'Verenigd Koninkrijk': [
    { label: 'England', value: 'England' },
    { label: 'Scotland', value: 'Scotland' },
  ],
  'Verenigde Staten': [
    { label: 'California', value: 'California' },
    { label: 'New York', value: 'New York' },
  ],
};

export default function EmailCampaignEditor() {
  const {
    campaignId
  } = useParams();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['email-campaign', campaignId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
    staleTime: 10_000
  });
  const [local, setLocal] = useState<any>(null);
  const [emailPrepActive, setEmailPrepActive] = useState<boolean>(false);
  useEffect(() => {
    if (data) setLocal(data);
  }, [data]);

  // Email AI preparation gate: show loader on the Emails tab for up to 60s after creation,
  // or until email_a is populated.
  useEffect(() => {
    const id = data?.id
    if (!id) return
    const key = `email_campaign_ai_until_${id}`
    const raw = localStorage.getItem(key)
    const until = raw ? Number(raw) : 0
    const now = Date.now()
    const initiallyPending = until > now && !(data as any)?.email_a
    setEmailPrepActive(initiallyPending)
    if (!initiallyPending) return
    const interval = window.setInterval(() => {
      const stillUntil = Number(localStorage.getItem(key) || '0')
      const now2 = Date.now()
      const shouldHide = now2 >= stillUntil || !!(localStorage.getItem(key) && (local as any)?.email_a) || !!(data as any)?.email_a
      if (shouldHide) {
        setEmailPrepActive(false)
        window.clearInterval(interval)
        localStorage.removeItem(key)
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [data, local])
  const dirty = useMemo(() => {
    if (!data || !local) return false;
    return JSON.stringify(local) !== JSON.stringify(data);
  }, [local, data]);
  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<any>) => {
      const allowedKeys = [
        'name','description','proposition_id','audience_filter','sending_window','status','campaign_purpose',
        'email_a','email_b','followup_a','followup_b','subject_a','subject_b',
      ] as const
      const safePayload: Record<string, any> = {}
      for (const key of allowedKeys) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          safePayload[key] = (payload as any)[key]
        }
      }
      const { data: upd, error } = await supabase
        .from('campaigns')
        .update(safePayload)
        .eq('id', campaignId)
        .select('*')
        .single()
      if (error) throw error
      return upd
    },
    onSuccess: upd => {
      setLocal(upd);
      toast({
        title: 'Opgeslagen'
      });
    },
    onError: (e: any) => toast({
      title: 'Opslaan mislukt',
      description: e?.message ?? 'Onbekende fout'
    })
  });
  const setField = (k: string, v: any) => setLocal((prev: any) => ({
    ...(prev || {}),
    [k]: v
  }));

  // Parse audience filter for multi-selects
  const audienceFilter = local?.audience_filter || {};
  const selectedFunctions = audienceFilter.function_group || [];
  const selectedIndustries = audienceFilter.industry || [];
  const selectedSubindustries = audienceFilter.subindustry || [];
  const selectedCountries = audienceFilter.country || [];
  const selectedStates = audienceFilter.state || [];
  const sizeMin = audienceFilter.company_size_min ?? '';
  const sizeMax = audienceFilter.company_size_max ?? '';
  const updateAudienceFilter = (key: string, value: string[]) => {
    setField('audience_filter', {
      ...audienceFilter,
      [key]: value
    });
  };

  // Derived option lists
  const subindustryOptionsFiltered: MultiOption[] = useMemo(() => {
    const map = new Map<string, MultiOption>()
    for (const parent of selectedIndustries as string[]) {
      for (const opt of (subindustryByParent[parent] || [])) map.set(opt.value, opt)
    }
    return Array.from(map.values())
  }, [selectedIndustries])

  const stateOptionsFiltered: MultiOption[] = useMemo(() => {
    const map = new Map<string, MultiOption>()
    for (const c of selectedCountries as string[]) {
      for (const opt of (statesByCountry[c] || [])) map.set(opt.value, opt)
    }
    return Array.from(map.values())
  }, [selectedCountries])
  if (isLoading) return <div className="p-6">Laden…</div>;
  if (error || !data) return <div className="p-6 text-destructive">Fout bij laden van campagne</div>;
  const status = local?.status || 'draft';
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-surface border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Terug naar campagnes
              </Button>
              <div className="h-8 w-px bg-border" />
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  {local?.name || 'Campagne Editor'}
                </h1>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : status === 'paused' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : status === 'stopped' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300'}`}>
                    {status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({
              status: 'active'
            })} className="gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400">
                <Play className="w-4 h-4" />
                Start
              </Button>
              <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({
              status: 'paused'
            })} className="gap-2 border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400">
                <PauseCircle className="w-4 h-4" />
                Pauzeer
              </Button>
              <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({
              status: 'stopped'
            })} className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400">
                <StopCircle className="w-4 h-4" />
                Stop
              </Button>
              <div className="h-6 w-px bg-border mx-1" />
              <Button size="sm" disabled={!dirty || updateMutation.isPending} onClick={() => updateMutation.mutate(local)} className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? 'Opslaan...' : 'Wijzigingen opslaan'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="emails" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 glass-card p-1 h-14">
            <TabsTrigger value="emails" className="flex items-center gap-3 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Mail className="w-4 h-4" />
              E-mails
            </TabsTrigger>
            <TabsTrigger value="doelgroep" className="flex items-center gap-3 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Target className="w-4 h-4" />
              Doelgroep
            </TabsTrigger>
            <TabsTrigger value="propositie" className="flex items-center gap-3 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4" />
              Propositie
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emails" className="space-y-6">
            {emailPrepActive && (
              <div className="p-4 border rounded-lg bg-muted/50 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-muted-foreground/40 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground">AI is je e-mailsequence aan het voorbereiden. Dit duurt maximaal 1 minuut…</p>
              </div>
            )}
            <div className="grid gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    E-mail Sequence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Variant A */}
                    <div className="grid gap-4">
                      <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                        <div className="font-medium mb-3">Variant A</div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Onderwerp A</label>
                            <Input value={local?.subject_a || ''} onChange={e=>setField('subject_a', e.target.value)} className="bg-background/50" placeholder="Subject A" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">E-mail A</label>
                            <Textarea rows={8} value={local?.email_a || ''} onChange={e=>setField('email_a', e.target.value)} className="bg-background/50 resize-none font-mono" placeholder="Email body A" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Follow-up A</label>
                            <Textarea rows={6} value={local?.followup_a || ''} onChange={e=>setField('followup_a', e.target.value)} className="bg-background/50 resize-none font-mono" placeholder="Follow-up body A" />
                          </div>
                        </div>
                      </div>

                      {/* Variant B */}
                      <div className="p-4 border rounded-lg bg-muted/40">
                        <div className="font-medium mb-3">Variant B</div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Onderwerp B</label>
                            <Input value={local?.subject_b || ''} onChange={e=>setField('subject_b', e.target.value)} className="bg-background/50" placeholder="Subject B" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">E-mail B</label>
                            <Textarea rows={8} value={local?.email_b || ''} onChange={e=>setField('email_b', e.target.value)} className="bg-background/50 resize-none font-mono" placeholder="Email body B" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Follow-up B</label>
                            <Textarea rows={6} value={local?.followup_b || ''} onChange={e=>setField('followup_b', e.target.value)} className="bg-background/50 resize-none font-mono" placeholder="Follow-up body B" />
                          </div>
                        </div>
                    </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          <TabsContent value="doelgroep" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary" />
                  Doelgroep Definitie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Functies */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Functies</label>
                  <MultiSelect options={functionOptions} value={selectedFunctions} onChange={value => updateAudienceFilter('function_group', value)} placeholder="Kies 1 of meer functies" />
                </div>

                {/* Industrie / Subindustrie */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Industrie</label>
                    <MultiSelect options={creationIndustryOptions} value={selectedIndustries} onChange={value => setField('audience_filter', { ...audienceFilter, industry: value, subindustry: [] })} placeholder="Kies 1 of meer industrieën" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Subindustrie</label>
                    <MultiSelect options={subindustryOptionsFiltered} value={selectedSubindustries} onChange={value => updateAudienceFilter('subindustry', value)} placeholder={selectedIndustries.length ? 'Kies 1 of meer subindustrieën' : 'Kies eerst industrie(en)'} disabled={selectedIndustries.length === 0} />
                  </div>
                </div>

                {/* Land / Provincie */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Land</label>
                    <MultiSelect options={[{label:'Nederland', value:'Nederland'},{label:'België', value:'België'},{label:'Duitsland', value:'Duitsland'},{label:'Frankrijk', value:'Frankrijk'},{label:'Verenigd Koninkrijk', value:'Verenigd Koninkrijk'},{label:'Verenigde Staten', value:'Verenigde Staten'}]} value={selectedCountries} onChange={value => setField('audience_filter', { ...audienceFilter, country: value, state: [] })} placeholder="Kies 1 of meer landen" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Provincie</label>
                    <MultiSelect options={stateOptionsFiltered} value={selectedStates} onChange={value => updateAudienceFilter('state', value)} placeholder={selectedCountries.length? 'Kies 1 of meer provincies' : 'Kies eerst land(en)'} disabled={selectedCountries.length === 0} />
                  </div>
                </div>

                {/* Company Size */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company size min</label>
                    <Input value={sizeMin} onChange={(e)=> setField('audience_filter', { ...audienceFilter, company_size_min: e.target.value ? Number(e.target.value) : undefined })} type="number" inputMode="numeric" className="bg-background/50" />
                  </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Company size max</label>
                    <Input value={sizeMax} onChange={(e)=> setField('audience_filter', { ...audienceFilter, company_size_max: e.target.value ? Number(e.target.value) : undefined })} type="number" inputMode="numeric" className="bg-background/50" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Smart Targeting</p>
                      <p className="text-sm text-muted-foreground">
                        Stem je doelgroep af met dezelfde filters als in het aanmaak-scherm. Wij slaan alles direct op bij bewaren.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="propositie" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Campagne Propositie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-3">
                    <label className="text-sm font-medium">Campagne Naam</label>
                      <Input value={local?.name || ''} onChange={e => setField('name', e.target.value)} className="bg-background/50" placeholder="Geef je campagne een naam..." />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Gekoppelde Propositie</label>
                      <PropositionSelect value={local?.proposition_id || null} onChange={v => setField('proposition_id', v)} placeholder="Selecteer een propositie..." />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Campagne Omschrijving</label>
                    <Textarea value={local?.description || ''} onChange={e => setField('description', e.target.value)} rows={8} className="bg-background/50 resize-none" placeholder="Beschrijf het doel en de strategie van deze campagne..." />
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                    <p className="text-sm font-medium">Propositie Koppeling</p>
                    <p className="text-sm text-muted-foreground">
                      Koppel je campagne aan een propositie om automatisch de juiste waardepropositie en messaging te gebruiken in je e-mails.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}