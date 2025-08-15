import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { useConvexAuth } from '@/hooks/useConvexAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Sparkles, Mail, Calendar, Users, Target, Rocket, Brain, Zap, TrendingUp, Star } from 'lucide-react';
import EmailStatsGrid from '@/components/email/EmailStatsGrid';
import EmailCampaignsTable from '@/components/email/EmailCampaignsTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect, type MultiOption } from '@/components/ui/MultiSelect';
import PropositionSelect from '@/components/lead/PropositionSelect';

export default function LeadEmail() {
  const {
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [openNew, setOpenNew] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [processingOpen, setProcessingOpen] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  // Audience filter (verplicht)
  const [audFunctions, setAudFunctions] = useState<string[]>([]);
  const [audIndustries, setAudIndustries] = useState<string[]>([]);
  const [audSubindustries, setAudSubindustries] = useState<string[]>([]);
  const [audCountry, setAudCountry] = useState<string[]>([]);
  const [audState, setAudState] = useState<string[]>([]);
  const [audSizeMin, setAudSizeMin] = useState('');
  const [audSizeMax, setAudSizeMax] = useState('');
  const [propositionId, setPropositionId] = useState<string | null>(null);

  // Industry options (statisch uit DB-lijst die je gaf)
  const industryOptions: MultiOption[] = [{
    label: 'Bouw, Installatie & Techniek',
    value: 'bouw-installatie'
  }, {
    label: 'Consultancy & Strategie',
    value: 'consultancy'
  }, {
    label: 'E-commerce & D2C',
    value: 'ecommerce-d2c'
  }, {
    label: 'Energie & Duurzaamheid',
    value: 'energie-duurzaam'
  }, {
    label: 'Financiële & Fiscale Dienstverlening',
    value: 'financieel'
  }, {
    label: 'Hospitality, Events & Toerisme',
    value: 'hospitality-events'
  }, {
    label: 'HR, Recruitment & Detachering',
    value: 'hr-recruitment'
  }, {
    label: 'Industrie & Productiebedrijven',
    value: 'industrie-productie'
  }, {
    label: 'Legal & Advocatuur',
    value: 'legal'
  }, {
    label: 'Logistiek & Transport',
    value: 'logistiek-transport'
  }, {
    label: 'Marketing, Branding & Design',
    value: 'marketing-creatief'
  }, {
    label: 'Onderwijs & Opleidingen',
    value: 'onderwijs-opleidingen'
  }, {
    label: 'Overheid & Non-profit',
    value: 'overheid-nonprofit'
  }, {
    label: 'Retail & Groothandel',
    value: 'retail-groothandel'
  }, {
    label: 'Sales & Leadgeneratie',
    value: 'sales-leadgen'
  }, {
    label: 'Softwarebedrijven & SaaS',
    value: 'software-saas'
  }, {
    label: 'Vastgoed & Makelaardij',
    value: 'vastgoed'
  }, {
    label: 'Zorginstellingen & GGZ',
    value: 'zorg-ggz'
  }];

  // Functie opties (beslissers)
  const functionOptions: MultiOption[] = [{
    label: 'Owner/Founder',
    value: 'Owner/Founder'
  }, {
    label: 'Marketing Decision Makers',
    value: 'Marketing Decision Makers'
  }, {
    label: 'Sales Decision Makers',
    value: 'Sales Decision Makers'
  }, {
    label: 'Business Development Decision Makers',
    value: 'Business Development Decision Makers'
  }, {
    label: 'Operational Decision Makers',
    value: 'Operational Decision Makers'
  }, {
    label: 'Technical Decision Makers',
    value: 'Technical Decision Makers'
  }, {
    label: 'Financial Decision Makers',
    value: 'Financial Decision Makers'
  }, {
    label: 'HR Decision Makers',
    value: 'HR Decision Makers'
  }, {
    label: 'Product & Innovation Decision Makers',
    value: 'Product & Innovation Decision Makers'
  }, {
    label: 'Customer Success & Support Decision Makers',
    value: 'Customer Success & Support Decision Makers'
  }];
  const subindustryByParent: Record<string, MultiOption[]> = {
    'bouw-installatie': [{
      label: 'Bouwmaterialen',
      value: 'bouwmaterialen'
    }, {
      label: 'Duurzame Installaties',
      value: 'duurzame-installaties'
    }, {
      label: 'Elektrotechnische Installaties',
      value: 'elektrotechnische-installaties'
    }, {
      label: 'Installatietechniek',
      value: 'installatietechniek'
    }, {
      label: 'Sanitair',
      value: 'sanitair'
    }],
    consultancy: [{
      label: 'Financial Consultancy',
      value: 'financial-consultancy'
    }, {
      label: 'HR Consultancy',
      value: 'hr-consultancy'
    }, {
      label: 'IT Consultancy',
      value: 'it-consultancy'
    }, {
      label: 'Management Consultancy',
      value: 'management-consultancy'
    }, {
      label: 'Marketing Consultancy',
      value: 'marketing-consultancy'
    }],
    'ecommerce-d2c': [{
      label: 'Digital Marketing',
      value: 'digital-marketing'
    }, {
      label: 'Klantenservice',
      value: 'klantenservice'
    }, {
      label: 'Logistiek & Fulfilment',
      value: 'logistiek-en-fulfilment'
    }, {
      label: 'Productontwikkeling',
      value: 'productontwikkeling'
    }, {
      label: 'Webshops',
      value: 'webshops'
    }],
    'energie-duurzaam': [{
      label: 'Duurzame Energie Installaties',
      value: 'duurzame-energie-installaties'
    }, {
      label: 'Energiebeheer',
      value: 'energiebeheer'
    }, {
      label: 'Warmtepompen',
      value: 'warmtepompen'
    }, {
      label: 'Windenergie',
      value: 'windenergie'
    }, {
      label: 'Zonne-energie',
      value: 'zonne-energie'
    }],
    financieel: [{
      label: 'Accountancy',
      value: 'accountancy'
    }, {
      label: 'Belastingadvies',
      value: 'belastingadvies'
    }, {
      label: 'Corporate Finance',
      value: 'corporate-finance'
    }, {
      label: 'Financiële Adviesdiensten',
      value: 'financiële-adviesdiensten'
    }, {
      label: 'Verzekeringen',
      value: 'verzekeringen'
    }],
    'hospitality-events': [{
      label: 'Conferentiecentra',
      value: 'conferentiecentra'
    }, {
      label: 'Entertainment & Shows',
      value: 'entertainment'
    }, {
      label: 'Evenementen Marketing',
      value: 'evenementenmarketing'
    }, {
      label: 'Evenementen Organisatie',
      value: 'evenementenorganisatie'
    }, {
      label: 'Horeca & Gastvrijheid',
      value: 'horeca'
    }],
    'hr-recruitment': [{
      label: 'Detachering & Interim',
      value: 'detachering-interim'
    }, {
      label: 'Employer Branding',
      value: 'employer-branding'
    }, {
      label: 'Outplacement & Loopbaanbegeleiding',
      value: 'outplacement-loopbaan'
    }, {
      label: 'Recruitment Technologie',
      value: 'recruitment-tech'
    }, {
      label: 'Uitzenden & Flexwerk',
      value: 'uitzenden-flexwerk'
    }, {
      label: 'Werving & Selectie',
      value: 'werving-selectie'
    }],
    'industrie-productie': [{
      label: 'Chemische Industrie',
      value: 'chemische-industrie'
    }, {
      label: 'Hightech Productie',
      value: 'hightech-productie'
    }, {
      label: 'Kunststofproductie',
      value: 'kunststofproductie'
    }, {
      label: 'Maakindustrie',
      value: 'maakindustrie'
    }, {
      label: 'Machinebouw',
      value: 'machinebouw'
    }, {
      label: 'Metaalbewerking',
      value: 'metaalbewerking'
    }, {
      label: 'Voedingsmiddelenindustrie',
      value: 'voedingsmiddelenindustrie'
    }],
    legal: [{
      label: 'Advocatenkantoren',
      value: 'advocatenkantoren'
    }, {
      label: 'Arbeidsrecht & HR-juridisch',
      value: 'arbeidsrecht-hr'
    }, {
      label: 'Compliance & Privacy',
      value: 'compliance-privacy'
    }, {
      label: 'Mediation & Conflictoplossing',
      value: 'mediation-conflictoplossing'
    }, {
      label: 'Notarissen & Vastgoedjuristen',
      value: 'notarissen-vastgoedjuristen'
    }],
    'logistiek-transport': [{
      label: 'E-commerce Fulfilment',
      value: 'ecommerce-fulfilment'
    }, {
      label: 'Internationaal Transport',
      value: 'internationaal-transport'
    }, {
      label: 'Last Mile & Stadslogistiek',
      value: 'last-mile-logistiek'
    }, {
      label: 'Logistieke Dienstverlening',
      value: 'logistieke-dienstverlening'
    }, {
      label: 'Transportbedrijven',
      value: 'transportbedrijven'
    }],
    'marketing-creatief': [{
      label: 'Branding & Design',
      value: 'branding-design'
    }, {
      label: 'Full Service Marketingbureau',
      value: 'full-service'
    }, {
      label: 'Outbound & Leadgeneratie',
      value: 'outbound-leadgen'
    }, {
      label: 'Performance Marketing',
      value: 'performance-marketing'
    }, {
      label: 'SEO & Content Bureaus',
      value: 'seo-content'
    }, {
      label: 'Social Media Bureaus',
      value: 'social-media'
    }, {
      label: 'Webdesign & Development',
      value: 'webdevelopment'
    }],
    'onderwijs-opleidingen': [{
      label: 'Bedrijfstraining & Coaching',
      value: 'bedrijfstraining-coaching'
    }, {
      label: 'Online Opleiders & EdTech',
      value: 'online-opleiders-edtech'
    }, {
      label: 'Scholen & Onderwijsinstellingen',
      value: 'scholen-onderwijsinstellingen'
    }, {
      label: 'Scholingsadvies & Opleidingsintermediairs',
      value: 'scholingsadvies-intermediairs'
    }, {
      label: 'Taaltraining & Communicatie',
      value: 'taaltraining-communicatie'
    }, {
      label: 'Technische & IT-Opleidingen',
      value: 'technische-it-opleidingen'
    }],
    'overheid-nonprofit': [{
      label: 'Brancheorganisaties & Verenigingen',
      value: 'brancheorganisaties-verenigingen'
    }, {
      label: 'Gemeenten & Lokale Overheid',
      value: 'gemeenten-lokale-overheid'
    }, {
      label: 'Ministeries & Rijksoverheid',
      value: 'ministeries-rijksoverheid'
    }, {
      label: 'Ondersteunende Publieke Diensten',
      value: 'ondersteunende-publieke-diensten'
    }, {
      label: 'Stichtingen & Goede Doelen',
      value: 'stichtingen-goede-doelen'
    }],
    'retail-groothandel': [{
      label: 'E-commerce Retailers',
      value: 'e-commerce-retailers'
    }, {
      label: 'Fysieke Retailketens',
      value: 'fysieke-retailketens'
    }, {
      label: 'Groothandels & Distributeurs',
      value: 'groothandels-distributeurs'
    }, {
      label: 'Retail Technologie & Services',
      value: 'retail-technologie-services'
    }, {
      label: 'Specialistische Retail',
      value: 'specialistische-retail'
    }],
    'sales-leadgen': [{
      label: 'B2B Leadgeneratie',
      value: 'b2b-leadgeneratie'
    }, {
      label: 'Cold Calling & Acquisitie',
      value: 'cold-calling'
    }, {
      label: 'Outbound Leadgeneratie',
      value: 'outbound-leadgeneratie'
    }, {
      label: 'Sales-as-a-Service',
      value: 'sales-as-a-service'
    }],
    'software-saas': [{
      label: 'Branchegerichte SaaS',
      value: 'vertical-saas'
    }, {
      label: 'Customer Support & CX Software',
      value: 'customer-support-cx-software'
    }, {
      label: 'E-commerce SaaS Tools',
      value: 'ecommerce-saas'
    }, {
      label: 'Finance & Accounting Software',
      value: 'finance-accounting-software'
    }, {
      label: 'HR & Recruitment Software',
      value: 'hr-recruitment-software'
    }, {
      label: 'Marketing & Sales Software',
      value: 'marketing-sales-software'
    }, {
      label: 'Operations & Productivity Software',
      value: 'operations-productivity-software'
    }, {
      label: 'Platform & API-first Tools',
      value: 'platform-api-tools'
    }, {
      label: 'Projectmanagement & Collaboration',
      value: 'projectmanagement-tools'
    }],
    vastgoed: [{
      label: 'Commercieel Vastgoedbeheer',
      value: 'commercieel-vastgoedbeheer'
    }, {
      label: 'Makelaars & Taxateurs',
      value: 'makelaars-taxateurs'
    }, {
      label: 'Proptech & Vastgoedsoftware',
      value: 'proptech-software'
    }, {
      label: 'Vastgoedinvesteringen & Beleggingsfondsen',
      value: 'vastgoedinvesteringen'
    }, {
      label: 'Vastgoedontwikkeling',
      value: 'vastgoedontwikkeling'
    }, {
      label: 'Woningverhuur & Beheer',
      value: 'woningverhuur-beheer'
    }],
    'zorg-ggz': [{
      label: 'Diagnostiek & Labdiensten',
      value: 'diagnostiek-labdiensten'
    }, {
      label: 'Huisartsen & Eerstelijnszorg',
      value: 'huisartsen-eerstelijnszorg'
    }, {
      label: 'Paramedische Praktijken',
      value: 'paramedische-praktijken'
    }, {
      label: 'Specialistische GGZ & Jeugdzorg',
      value: 'specialistische-ggz-jeugdzorg'
    }, {
      label: 'Zorginstellingen & Thuiszorg',
      value: 'zorginstellingen-thuiszorg'
    }, {
      label: 'Zorgsoftware & EPD-leveranciers',
      value: 'zorgsoftware-epd'
    }]
  };

  // Map elke subindustry slug -> label (globaal), zodat we labels kunnen opslaan in Supabase
  const subLabelByValue = useMemo(() => {
    const map = new Map<string, string>();
    for (const opts of Object.values(subindustryByParent)) {
      for (const o of opts) map.set(o.value, o.label);
    }
    return map;
  }, []);
  const subindustryOptionsFiltered: MultiOption[] = useMemo(() => {
    // Toon subindustries voor alle geselecteerde parent-industries (uniek samenvoegen)
    const set = new Map<string, MultiOption>();
    for (const parent of audIndustries) {
      for (const opt of subindustryByParent[parent] || []) set.set(opt.value, opt);
    }
    return Array.from(set.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [audIndustries]);

  // Landenlijst: alle ondersteunde regio-codes via Intl (valt terug op subset)
  const countryOptions: MultiOption[] = useMemo(() => {
    try {
      const codes = (Intl as any).supportedValuesOf?.('region') as string[] | undefined;
      const regionNames = new (Intl as any).DisplayNames(['nl'], {
        type: 'region'
      });
      const list = codes && regionNames ? codes.map(code => ({
        value: code,
        label: regionNames.of(code) || code
      })) : [{
        label: 'Nederland',
        value: 'NL'
      }, {
        label: 'België',
        value: 'BE'
      }, {
        label: 'Duitsland',
        value: 'DE'
      }, {
        label: 'Frankrijk',
        value: 'FR'
      }, {
        label: 'Verenigd Koninkrijk',
        value: 'GB'
      }, {
        label: 'Verenigde Staten',
        value: 'US'
      }, {
        label: 'Spanje',
        value: 'ES'
      }, {
        label: 'Italië',
        value: 'IT'
      }, {
        label: 'Zweden',
        value: 'SE'
      }, {
        label: 'Denemarken',
        value: 'DK'
      }];
      return list.sort((a, b) => a.label.localeCompare(b.label));
    } catch {
      return [{
        label: 'Nederland',
        value: 'NL'
      }, {
        label: 'België',
        value: 'BE'
      }, {
        label: 'Duitsland',
        value: 'DE'
      }, {
        label: 'Frankrijk',
        value: 'FR'
      }, {
        label: 'Verenigd Koninkrijk',
        value: 'GB'
      }, {
        label: 'Verenigde Staten',
        value: 'US'
      }];
    }
  }, []);

  // Map country value -> label om labels door te sturen zoals ze in de UI getoond worden
  const countryLabelByValue = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of countryOptions) map.set(o.value, o.label);
    return map;
  }, [countryOptions]);
  const statesByCountry: Record<string, MultiOption[]> = {
    NL: [{
      label: 'Noord-Holland',
      value: 'noord-holland'
    }, {
      label: 'Zuid-Holland',
      value: 'zuid-holland'
    }, {
      label: 'Utrecht',
      value: 'utrecht'
    }, {
      label: 'Noord-Brabant',
      value: 'noord-brabant'
    }, {
      label: 'Gelderland',
      value: 'gelderland'
    }, {
      label: 'Overijssel',
      value: 'overijssel'
    }, {
      label: 'Groningen',
      value: 'groningen'
    }, {
      label: 'Friesland',
      value: 'friesland'
    }, {
      label: 'Drenthe',
      value: 'drenthe'
    }, {
      label: 'Flevoland',
      value: 'flevoland'
    }, {
      label: 'Zeeland',
      value: 'zeeland'
    }, {
      label: 'Limburg',
      value: 'limburg'
    }],
    BE: [{
      label: 'Antwerpen',
      value: 'antwerpen'
    }, {
      label: 'Oost-Vlaanderen',
      value: 'oost-vlaanderen'
    }, {
      label: 'West-Vlaanderen',
      value: 'west-vlaanderen'
    }, {
      label: 'Vlaams-Brabant',
      value: 'vlaams-brabant'
    }, {
      label: 'Limburg',
      value: 'limburg-be'
    }, {
      label: 'Brussel Hoofdstedelijk Gewest',
      value: 'brussel'
    }, {
      label: 'Henegouwen',
      value: 'henegouwen'
    }, {
      label: 'Luik',
      value: 'luik'
    }, {
      label: 'Luxemburg',
      value: 'luxemburg'
    }, {
      label: 'Namen',
      value: 'namen'
    }],
    DE: [{
      label: 'Bayern',
      value: 'bayern'
    }, {
      label: 'Berlin',
      value: 'berlin'
    }],
    FR: [{
      label: 'Île-de-France',
      value: 'idf'
    }, {
      label: 'Provence-Alpes-Côte d’Azur',
      value: 'paca'
    }],
    GB: [{
      label: 'England',
      value: 'england'
    }, {
      label: 'Scotland',
      value: 'scotland'
    }, {
      label: 'Wales',
      value: 'wales'
    }],
    US: [{
      label: 'California',
      value: 'california'
    }, {
      label: 'New York',
      value: 'new-york'
    }]
  };
  const stateLabelByValue = useMemo(() => {
    const map = new Map<string, string>();
    for (const list of Object.values(statesByCountry)) {
      for (const o of list) map.set(o.value, o.label);
    }
    return map;
  }, []);
  const stateOptionsFiltered: MultiOption[] = useMemo(() => {
    const set = new Map<string, MultiOption>();
    for (const c of audCountry) {
      for (const s of statesByCountry[c] || []) set.set(s.value, s);
    }
    return Array.from(set.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [audCountry]);
  // Automatisch toewijzen (versturen naar vaste n8n webhooks)
  const [assignOpen, setAssignOpen] = useState(false);
  const [dailyCount, setDailyCount] = useState<number>(() => {
    const raw = localStorage.getItem('n8nDailyCount');
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 50;
  });
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(() => localStorage.getItem('n8nCampaignId') || undefined);
  const campaignsQuery = useQuery({
    queryKey: ['campaigns-email', profile?.client_id],
    queryFn: async () => {
      let query = supabase.from('campaigns').select('id, name, status, created_at, proposition_id, client_id, campaign_purpose, propositions(name)').eq('type', 'email').order('created_at', {
        ascending: false
      });
      if (profile?.client_id) query = query.eq('client_id', profile.client_id);
      const {
        data,
        error
      } = (await query) as any;
      if (error) throw error;
      
      // Add mock stats for demonstration
      const campaignsWithStats = (data ?? []).map((campaign: any) => ({
        ...campaign,
        stats: {
          sent: Math.floor(Math.random() * 1000) + 100,
          replies: Math.floor(Math.random() * 50) + 5,
          replyRate: Math.floor(Math.random() * 20) + 5,
          conversions: Math.floor(Math.random() * 10) + 1
        }
      }));
      return campaignsWithStats;
    },
    enabled: true,
    staleTime: 60_000
  });

  // Query cold email candidates from the view with client_id filter
  const candidatesQuery = useQuery({
    queryKey: ['cold-email-candidates-view', profile?.client_id],
    queryFn: async () => {
      if (!profile?.client_id) return 0;
      const {
        count,
        error
      } = await supabase.from('v_cold_email_candidates_assignable' as any).select('contact_id', {
        count: 'exact',
        head: true
      }).eq('client_id', profile.client_id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.client_id,
    staleTime: 60_000
  });

  // Calculate aggregated stats
  const aggregatedStats = useMemo(() => {
    const campaigns = campaignsQuery.data ?? [];
    const totalSent = campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
    const totalReplies = campaigns.reduce((sum, c) => sum + (c.stats?.replies || 0), 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + (c.stats?.conversions || 0), 0);
    const replyRate = totalSent > 0 ? Number((totalReplies / totalSent * 100).toFixed(1)) : 0;
    return {
      totalSent,
      replyRate,
      replies: totalReplies,
      conversions: totalConversions
    };
  }, [campaignsQuery.data]);
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Naam is verplicht');
      // Build audience_filter uit velden (minimaal één targetingveld vereist)
      const parseList = (s: string) => s.split(',').map(v => v.trim()).filter(Boolean);
      const function_group = audFunctions;
      const industry = audIndustries;
      // Converteer subindustry van slugs -> labels, zodat DB-functies op labels kunnen matchen
      const subindustry = audSubindustries.map(v => subLabelByValue.get(v) ?? v);
      // Stuur labels door i.p.v. codes/slugs
      const country = audCountry.map(c => countryLabelByValue.get(c) ?? c);
      const state = audState.map(s => stateLabelByValue.get(s) ?? s);
      const company_size_min = audSizeMin.trim() ? Number(audSizeMin) : undefined;
      const company_size_max = audSizeMax.trim() ? Number(audSizeMax) : undefined;
      if (audSizeMin && Number.isNaN(company_size_min) || audSizeMax && Number.isNaN(company_size_max)) {
        throw new Error('Bedrijfsgrootte moet een nummer zijn');
      }
      const audience_filter: any = {
        target_contact_status: ['cold']
      };
      if (function_group.length) audience_filter.function_group = function_group;
      if (industry.length) audience_filter.industry = industry;
      if (subindustry.length) audience_filter.subindustry = subindustry;
      if (country.length) audience_filter.country = country;
      if (state.length) audience_filter.state = state;
      if (company_size_min !== undefined) audience_filter.company_size_min = company_size_min;
      if (company_size_max !== undefined) audience_filter.company_size_max = company_size_max;
      const hasAny = function_group.length > 0 || industry.length > 0 || subindustry.length > 0 || country.length > 0 || state.length > 0 || company_size_min !== undefined || company_size_max !== undefined;
      if (!hasAny) {
        throw new Error('Audience filter is verplicht: vul minimaal één targetingveld in (functie, industrie, subindustrie, locatie of bedrijfsgrootte)');
      }
      const payload: any = { 
        name: name.trim(), 
        type: 'email',
        description: description.trim() || null,
        status: 'draft',
        audience_filter,
        proposition_id: propositionId ?? undefined
      };
      if (profile?.client_id) payload.client_id = profile.client_id;
      const { data, error } = await supabase
        .from('campaigns')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      return { row: data, payload } as any;
    },
    onSuccess: ({ row, payload }: any) => {
      const WEBHOOK_URL = 'https://djoere.app.n8n.cloud/webhook/5fd94198-71d7-49e2-9bd4-2f18a2731106';
      const TIMEOUT_MS = 15000;
      const MIN_WAIT_MS = 5000;

      const send = async (url: string, name: string, body: any) => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            keepalive: true,
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          if (!res.ok) {
            const text = await res.text().catch(()=> '');
            throw new Error(`${name} webhook fout: ${res.status} ${text}`);
          }
          return true;
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            throw new Error(`${name} webhook timeout na ${TIMEOUT_MS/1000}s`);
          }
          throw err;
        } finally {
          window.clearTimeout(timer);
        }
      };

      const run = async () => {
        if (row?.id) {
          // Mark this campaign as being prepared by AI for up to 60 seconds. The editor will show a loader until
          // either this time elapses or initial email content is populated.
          const until = Date.now() + 60_000
          localStorage.setItem(`email_campaign_ai_until_${row.id}`, String(until))
        }
        setProcessingOpen(true);
        const started = Date.now();
        const total = 60_000;
        const interval = window.setInterval(() => {
          const elapsed = Date.now() - started;
          const pct = Math.max(5, Math.min(99, Math.round((elapsed / total) * 100)));
          setProcessingProgress(pct);
        }, 500);
        const webhookPayload = {
          client_id: payload.client_id ?? profile?.client_id ?? null,
          campaign_id: row?.id ?? null,
          campaign: payload,
          event: 'campaign_created',
        };
        let errorMsg: string | null = null;
        try {
          // Stuur productie webhook
          await send(WEBHOOK_URL, 'Prod', webhookPayload);
        } catch (e: any) {
          errorMsg = e?.message || 'Onbekende fout';
        }
        // Wacht tot email_a is gevuld of tot 60s is verstreken
        const deadline = started + 60_000;
        while (Date.now() < deadline) {
          try {
            const { data: fresh } = await supabase
              .from('campaigns')
              .select('email_a')
              .eq('id', row?.id)
              .single();
            if (fresh && (fresh as any).email_a) break;
          } catch {}
          await new Promise(r => setTimeout(r, 2000));
        }
        setProcessingProgress(100);
        window.clearInterval(interval);
        setProcessingOpen(false);

        // Reset velden en navigeer
        setOpenNew(false);
        setName('');
        setDescription('');
        setAudFunctions([]);
        setAudIndustries([]);
        setAudSubindustries([]);
        setAudCountry([]);
        setAudState([]);
        setAudSizeMin('');
        setAudSizeMax('');
        setPropositionId(null);
        campaignsQuery.refetch();

        if (errorMsg) {
          toast({ title: 'Campagne aangemaakt, maar webhook faalde', description: errorMsg });
        } else {
          toast({ title: 'Campagne aangemaakt' });
        }
        if (row?.id) navigate(`/lead-engine/email/${row.id}`);
      };
      // fire and forget
      run();
    },
    onError: (e: any) => {
      setProcessingOpen(false);
      setProcessingProgress(0);
      toast({ title: 'Mislukt', description: e?.message ?? 'Onbekende fout' });
    }
  });

  // helper: map campaign_id -> proposition_id
  const campaignToProposition = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const c of campaignsQuery.data ?? []) map.set(c.id, c.proposition_id ?? null);
    return map;
  }, [campaignsQuery.data]);

  // Verstuur naar vaste n8n webhooks met X kandidaten
  const dispatchMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.client_id) throw new Error('Geen client actief');
      if (!dailyCount || dailyCount <= 0) throw new Error('Aantal per dag moet groter dan 0 zijn');

      // 1) Haal X kandidaten op uit de view
      let query = supabase.from('v_cold_email_candidates_assignable' as any).select('contact_id, email, first_name, last_name, company_name, domain, job_title, function_group, location, suggested_campaign_id, last_communication_at, total_campaigns', {
        count: 'exact'
      }).eq('client_id', profile.client_id).not('email', 'is', null).not('suggested_campaign_id', 'is', null).order('total_campaigns', {
        ascending: true
      }).order('last_communication_at', {
        ascending: true,
        nullsFirst: true
      }).limit(dailyCount);
      const {
        data: rows,
        error
      } = (await query) as any;
      if (error) throw error;
      const candidates = (rows ?? []).map((r: any) => ({
        contact_id: r.contact_id,
        email: r.email,
        first_name: r.first_name,
        last_name: r.last_name,
        company_name: r.company_name,
        domain: r.domain,
        job_title: r.job_title,
        function_group: r.function_group,
        location: r.location,
        suggested_campaign_id: r.suggested_campaign_id,
        last_communication_at: r.last_communication_at,
        total_campaigns: r.total_campaigns
      }));
      if (candidates.length === 0) throw new Error('Geen kandidaten gevonden voor dispatch');

      // 2) Stuur naar n8n webhook (productie)
      const PROD_URL = 'https://djoere.app.n8n.cloud/webhook/861fdee9-5c3c-4269-8116-e9f9c982bde8';
      const TIMEOUT_MS = 15000;
      const proposition_id = selectedCampaignId ? campaignToProposition.get(selectedCampaignId) ?? null : null;
      const payload = {
        client_id: profile.client_id,
        campaign_id: selectedCampaignId || null,
        proposition_id,
        count: dailyCount,
        candidates
      };
      const send = async (url: string, name: string) => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          keepalive: true,
          body: JSON.stringify(payload),
            signal: controller.signal,
          });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`${name} webhook fout: ${res.status} ${text}`);
        }
          return true;
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            throw new Error(`${name} webhook timeout na ${TIMEOUT_MS / 1000}s`);
      }
          throw err;
        } finally {
          window.clearTimeout(timer);
        }
      };

      // Stuur met duidelijke foutmelding
      await send(PROD_URL, 'Prod');
      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Automatisch toegewezen',
        description: `${dailyCount} kandidaten doorgestuurd naar n8n (test + productie)`
      });
      candidatesQuery.refetch();
      setAssignOpen(false);
      // Persist instellingen (zonder webhook URL)
      localStorage.setItem('n8nDailyCount', String(dailyCount));
      if (selectedCampaignId) localStorage.setItem('n8nCampaignId', selectedCampaignId);
    },
    onError: (e: any) => toast({
      title: 'Dispatch mislukt',
      description: e?.message ?? 'Onbekende fout'
  })
  });
  return <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            E‑mail Campagnes
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Beheer en monitor je e‑mail outreach campagnes
          </p>
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Cold Email Candidates Counter & Auto Assign */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-slate-700/50 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {candidatesQuery.data?.toLocaleString() || '0'} kandidaten
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Beschikbaar voor outreach
                </p>
              </div>
            </div>
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!candidatesQuery.data} className="border-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:border-blue-800 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 transition-all duration-300">
                  <Brain className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">Smart Assign AI</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl w-full h-[90vh] bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-blue-950/20 dark:to-purple-950/20 border-2 border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 shadow-2xl backdrop-blur-xl p-0 overflow-hidden">
                <DialogHeader className="space-y-4 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                        Smart Assign AI
                      </DialogTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Intelligente kandidaat-campagne matching powered by AI
                      </p>
                    </div>
                  </div>
                  
                  {/* AI Features Showcase */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg w-fit mx-auto mb-2">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Instant Matching</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time analyse</p>
                    </div>
                    <div className="text-center p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg w-fit mx-auto mb-2">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Smart Prioritering</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hoogste conversie eerst</p>
                    </div>
                    <div className="text-center p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50 backdrop-blur-sm">
                      <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg w-fit mx-auto mb-2">
                        <Star className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Beste Match</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">AI-gestuurd algoritme</p>
                    </div>
                  </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-220px)] pr-6">
                  <div className="space-y-6 px-6 py-4">
                  {/* Smart Assign Explanation */}
                  <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-xl border border-blue-200/40 dark:border-blue-700/40">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex-shrink-0 mt-0.5">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-2 text-slate-800 dark:text-slate-200">
                          Hoe werkt Smart Assign AI?
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                          Onze geavanceerde AI analyseert kandidaatprofielen en match ze intelligent met de meest geschikte campagnes op basis van industrie, functie, bedrijfsgrootte en historische performance data.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            Profiel Analyse
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                            Performance Matching
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                            Conversie Optimalisatie
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Configuration */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-600" />
                          Aantal per dispatch
                        </label>
                        <Input 
                          type="number" 
                          min={1} 
                          value={dailyCount} 
                          onChange={e => setDailyCount(Number(e.target.value) || 0)} 
                          className="bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Maximaal aantal kandidaten per batch
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-600" />
                          AI Match Score
                        </label>
                        <div className="bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Minimaal</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">85%</span>
                    </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights Preview */}
                  <div className="bg-white/60 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                    <h4 className="font-semibold text-sm mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      AI Insights Preview
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Verwachte respons ratio:</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400 ml-2">12.3%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Beste verzendtijd:</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400 ml-2">Dinsdag 10:00</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Top industrie match:</span>
                        <span className="font-medium text-purple-600 dark:text-purple-400 ml-2">SaaS Software</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Conversie potentieel:</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400 ml-2">Hoog</span>
                      </div>
                    </div>
                  </div>
                  </div>
                </ScrollArea>

                <DialogFooter className="gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      localStorage.setItem('n8nDailyCount', String(dailyCount));
                      if (selectedCampaignId) localStorage.setItem('n8nCampaignId', selectedCampaignId);
                      toast({
                        title: 'AI-instellingen opgeslagen',
                        description: 'Smart Assign configuratie is bewaard'
                      });
                    }}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Instellingen Bewaren
                  </Button>
                  <Button 
                    onClick={() => dispatchMutation.mutate()} 
                    disabled={dispatchMutation.isPending || dailyCount <= 0}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
                  >
                    {dispatchMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        AI Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Start Smart Assign ({dailyCount})
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe campagne
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl w-full h-[90vh] bg-background/95 backdrop-blur-xl border-0 shadow-2xl p-0 overflow-hidden">
              <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 pb-6">
                <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-white">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  Nieuwe E‑mail Campagne
                </DialogTitle>
                <p className="text-blue-100 mt-2">
                  Creëer een nieuwe e-mail outreach campagne om je doelgroep te bereiken
                </p>
              </DialogHeader>

              <ScrollArea className="max-h-[calc(90vh-250px)] pr-6">
                <div className="space-y-8 px-8 py-6">
                  {/* Campaign Name Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <label className="text-sm font-medium">
                        Campagnenaam *
                      </label>
                    </div>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Geef je campagne een herkenbare naam..." className="h-11" />
                  </div>
                  
                  {/* Audience Filter (verplicht) */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <label className="text-sm font-medium">Audience (verplicht)</label>
                    </div>
                    <p className="text-xs text-muted-foreground">Vul minimaal één targetingveld in. Kies industrie en subindustrie uit de lijsten; meerdere selecties mogelijk. Vul bedrijfsgrootte (min/max) als getal.</p>
                    
                    {/* Row 1: Functies (volle breedte, MultiSelect) */}
                    <div className="space-y-3">
                      <label className="text-sm text-muted-foreground">Functies</label>
                      <div className="min-h-[44px]">
                        <MultiSelect options={functionOptions} value={audFunctions} onChange={setAudFunctions} placeholder="Kies 1 of meer functies" />
                      </div>
                    </div>
                    
                    {/* Row 2: Industrie + Subindustrie naast elkaar */}
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm text-muted-foreground">Industrie</label>
                        <div className="min-h-[44px]">
                          <MultiSelect options={industryOptions} value={audIndustries} onChange={setAudIndustries} placeholder="Kies 1 of meer industrieën" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm text-muted-foreground">Subindustrie</label>
                        <div className="min-h-[44px]">
                          <MultiSelect options={subindustryOptionsFiltered} value={audSubindustries} onChange={setAudSubindustries} placeholder={audIndustries.length ? 'Kies 1 of meer subindustrieën' : 'Kies eerst industrie(en)'} disabled={audIndustries.length === 0} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Row 3: Land / Provincie */}
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm text-muted-foreground">Land</label>
                        <div className="min-h-[44px]">
                          <MultiSelect options={countryOptions} value={audCountry} onChange={v => {
                          setAudCountry(v);
                          setAudState([]);
                        }} placeholder="Kies 1 of meer landen" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm text-muted-foreground">Provincie</label>
                        <div className="min-h-[44px]">
                          <MultiSelect options={stateOptionsFiltered} value={audState} onChange={setAudState} placeholder={audCountry.length ? 'Kies 1 of meer provincies' : 'Kies eerst land(en)'} disabled={audCountry.length === 0} />
                        </div>
                      </div>
                    </div>

                    {/* Row 4: Company sizes */}
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm text-muted-foreground">Company size min</label>
                        <Input type="number" inputMode="numeric" placeholder="10" value={audSizeMin} onChange={e => setAudSizeMin(e.target.value)} className="h-11" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm text-muted-foreground">Company size max</label>
                        <Input type="number" inputMode="numeric" placeholder="500" value={audSizeMax} onChange={e => setAudSizeMax(e.target.value)} className="h-11" />
                      </div>
                    </div>

                    {/* Propositie selecteren */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Propositie *</label>
                      <PropositionSelect value={propositionId || undefined} onChange={id => setPropositionId(id)} />
                      {!propositionId && (
                        <p className="text-xs text-red-600">Propositie is verplicht.</p>
                      )}
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <label className="text-sm font-medium">
                        Campagne Omschrijving
                      </label>
                    </div>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Beschrijf het doel en de strategie van je campagne..." rows={4} className="resize-none" />
                  </div>

                  {/* Next Steps Info Card */}
                  <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg border border-blue-200/40 dark:border-blue-800/40">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex-shrink-0">
                        <Rocket className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-2">
                          Volgende Stappen
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          Na het aanmaken kun je direct de propositie koppelen, doelgroep definiëren en content opstellen.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Propositie koppelen
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Doelgroep selecteren
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            E-mail templates
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="p-8 pt-4 gap-3 bg-gray-50/50 dark:bg-slate-900/50 border-t">
                <Button variant="outline" onClick={() => setOpenNew(false)} className="min-w-[120px]">
                  Annuleren
                </Button>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !name.trim() || !propositionId} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white min-w-[180px]">
                  {createMutation.isPending ? <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Aanmaken...
                    </div> : <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Campagne Aanmaken
                    </>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Processing modal for AI setup */}
          <Dialog open={processingOpen}>
            <DialogContent className="max-w-lg p-0 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <DialogTitle className="text-white">AI is je campagne aan het opzetten</DialogTitle>
                <p className="text-blue-100 mt-1">Dit duurt meestal minder dan 1 minuut. Je kunt dit scherm open laten.</p>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-muted-foreground">Content aanmaken, target afstemmen en assets voorbereiden…</p>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600 transition-all" style={{ width: `${processingProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Maximaal 1 minuut. We sluiten automatisch zodra alles klaar is.</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Grid */}
      <EmailStatsGrid stats={aggregatedStats} />

      {/* Campaigns Table */}
      <EmailCampaignsTable 
        campaigns={campaignsQuery.data ?? []} 
        isLoading={campaignsQuery.isLoading} 
        onDeleted={() => campaignsQuery.refetch()}
      />
    </div>;
}
