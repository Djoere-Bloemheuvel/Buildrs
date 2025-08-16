import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

import { Search, Download, ChevronLeft, ChevronRight, Building2, Mail, MapPin, ChevronRight as ChevronRightIcon, Filter, Star, Menu, Users, Briefcase, Globe, Plus, RotateCcw, Archive, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { MultiSelect, MultiOption } from '@/components/ui/MultiSelect';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useConvexAuth } from '@/hooks/useConvexAuth';
import { toast } from 'react-hot-toast';

// Same type as Contacts page
type EnrichedContact = {
  id: string
  contact_id?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  mobile_phone?: string | null
  status?: string | null
  company_name?: string | null
  domain?: string | null
  website?: string | null
  linkedin_url?: string | null
  job_title?: string | null
  function_group?: string | null
  industry?: string | null
  industry_label?: string | null
  subindustry_label?: string | null
  employee_count?: number | null
  company_size?: number | null
  city?: string | null
  state?: string | null
  country?: string | null
  company_city?: string | null
  company_state?: string | null
  company_country?: string | null
  contact_city?: string | null
  contact_state?: string | null
  contact_country?: string | null
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'hot':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'warm':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'cold':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'qualified':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'unqualified':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export default function LeadDatabase() {
  const [search, setSearch] = useState<string>('');
  const { user, getClientId } = useConvexAuth();
  // Use real client ID from authenticated user
  const profile = { client_id: getClientId() };

  // Filter states
  const [selectedFunctionGroups, setSelectedFunctionGroups] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSubindustries, setSelectedSubindustries] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [employeeCountMin, setEmployeeCountMin] = useState<number>(1);
  const [employeeCountMax, setEmployeeCountMax] = useState<number>(1000);
  const [employeeMinTextInput, setEmployeeMinTextInput] = useState<string>('');
  const [employeeMaxTextInput, setEmployeeMaxTextInput] = useState<string>('');
  
  // Lead selection state for conversion
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showConversionModal, setShowConversionModal] = useState<boolean>(false);
  const [showManualConversionModal, setShowManualConversionModal] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  
  // Target audience conversion state
  const [targetFunctionGroups, setTargetFunctionGroups] = useState<string[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [audienceEmployeeMin, setAudienceEmployeeMin] = useState<number>(1);
  const [audienceEmployeeMax, setAudienceEmployeeMax] = useState<number>(1000);
  const [targetCountries, setTargetCountries] = useState<string[]>([]);
  const [targetAmount, setTargetAmount] = useState<number>(50);
  const [matchedLeads, setMatchedLeads] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Automation settings
  const [enableAutomation, setEnableAutomation] = useState<boolean>(false);
  const [automationName, setAutomationName] = useState<string>('');
  const [dailyLimit, setDailyLimit] = useState<number | ''>('');
  const [activeTab, setActiveTab] = useState<string>("direct");

  // Backend mutations - using NEW EXACT system
  const convertLeadsToContacts = useMutation(api.exactLeadConversion.convertExactMatchLeads);
  const getTargetAudienceLeads = useMutation(api.exactLeadConversion.getExactMatchLeads);
  
  // Smart Conversion Automation mutations
  const createSmartConversionAutomation = useMutation(api.simpleSmartConversion.createSimpleSmartConversion);
  const smartConversionAutomations = useQuery(api.simpleSmartConversion.getSmartConversions, {
    clientIdentifier: profile?.client_id || "",
  });

  // Filter panel states
  const [functionGroupOpen, setFunctionGroupOpen] = useState(false);
  const [employeesOpen, setEmployeesOpen] = useState(false);
  const [brancheOpen, setBrancheOpen] = useState(false);
  const [subbrancheOpen, setSubbrancheOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(100);

  // Get filter options using NEW EXACT system
  const filterOptions = useQuery(api.exactLeadDatabase.getExactFilterOptions);
  const filteredLocationOptions = filterOptions ? {
    countries: filterOptions.countries,
    provinces: [], // Not implemented in exact system yet
    cities: [], // Not implemented in exact system yet
  } : undefined;
  const filteredIndustryOptions = filterOptions ? {
    industries: filterOptions.industries,
    subindustries: [], // Not implemented in exact system yet
  } : undefined;
  const filterOptionsLoading = filterOptions === undefined;

  // Get leads data using NEW EXACT FILTERING system
  const targetEmployeeMin = employeeMinTextInput ? parseInt(employeeMinTextInput) : employeeCountMin;
  const targetEmployeeMax = employeeMaxTextInput ? parseInt(employeeMaxTextInput) : employeeCountMax;
  const data = useQuery(api.exactLeadDatabase.getExactFilteredLeads, {
    searchTerm: search || undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    functionGroups: selectedFunctionGroups.length > 0 ? selectedFunctionGroups : undefined,
    industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
    countries: selectedCountries.length > 0 ? selectedCountries : undefined,
    minEmployeeCount: targetEmployeeMin > 1 ? targetEmployeeMin : undefined,
    maxEmployeeCount: targetEmployeeMax < 1000 ? targetEmployeeMax : undefined,
    clientIdentifier: profile?.client_id || "",
  });

  const isLoading = data === undefined;
  
  // Map exact lead data to EnrichedContact interface
  const contacts: EnrichedContact[] = (data?.data || []).map(lead => {
    // DEBUG: Log employee count data
    console.log(`🔍 Lead Debug for ${lead.firstName} ${lead.lastName}:`, {
      employeeCount: lead.employeeCount,
      companySize: lead.companySize,
      debugEmployeeData: lead.debugEmployeeData,
      companyName: lead.companyName
    });
    
    return {
    id: lead._id,
    contact_id: lead._id,
    first_name: lead.firstName,
    last_name: lead.lastName,
    email: lead.email,
    mobile_phone: lead.mobilePhone,
    job_title: lead.jobTitle,
    function_group: lead.functionGroup,
    linkedin_url: lead.linkedinUrl,
    // Company data
    company_name: lead.companyName,
    domain: lead.domain,
    website: lead.website,
    company_linkedin_url: lead.companyLinkedinUrl,
    industry: lead.industry,
    industry_label: lead.industry,
    subindustry_label: lead.subindustryLabel,
    employee_count: lead.employeeCount || lead.companySize,
    company_size: lead.companySize || lead.employeeCount,
    // Location data - Contact
    country: lead.country,
    contact_country: lead.country,
    state: lead.state,
    contact_state: lead.state,
    city: lead.city,
    contact_city: lead.city,
    // Location data - Company
    company_country: lead.companyCountry,
    company_state: lead.companyState,
    company_city: lead.companyCity,
    // Additional metadata
    company_summary: lead.companySummary,
    short_company_summary: lead.shortCompanySummary,
    }
  });
  
  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const resetFilters = () => {
    setSearch('');
    setSelectedFunctionGroups([]);
    setSelectedIndustries([]);
    setSelectedSubindustries([]);
    setSelectedLocations([]);
    setSelectedCountries([]);
    setSelectedProvinces([]);
    setSelectedCities([]);
    setEmployeeCountMin(1);
    setEmployeeCountMax(1000);
    setEmployeeMinTextInput('');
    setEmployeeMaxTextInput('');
    setPage(1);
  };

  // Lead selection functions
  const toggleLeadSelection = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const selectAllLeads = () => {
    const currentPageLeadIds = contacts.map(contact => contact.id);
    const newSelected = new Set(selectedLeads);
    currentPageLeadIds.forEach(id => newSelected.add(id));
    setSelectedLeads(newSelected);
  };

  const deselectAllLeads = () => {
    const currentPageLeadIds = new Set(contacts.map(contact => contact.id));
    const newSelected = new Set(selectedLeads);
    currentPageLeadIds.forEach(id => newSelected.delete(id));
    setSelectedLeads(newSelected);
  };

  // Check if all leads on current page are selected
  const allCurrentPageSelected = contacts.length > 0 && contacts.every(contact => selectedLeads.has(contact.id));
  const someCurrentPageSelected = contacts.some(contact => selectedLeads.has(contact.id));

  const handleConvertToContacts = () => {
    if (selectedLeads.size === 0) {
      return; // No leads selected
    }
    setShowManualConversionModal(true);
  };

  const performConversion = async () => {
    if (selectedLeads.size === 0 || !profile?.client_id) {
      toast.error('Geen leads geselecteerd of geen client ID beschikbaar');
      return;
    }

    setIsConverting(true);

    try {
      const leadIdsArray = Array.from(selectedLeads);
      const result = await convertLeadsToContacts({
        leadIds: leadIdsArray as any[], // Type assertion needed for Convex ID type
        clientIdentifier: profile.client_id, // Using string identifier
      });

      if (result.success) {
        toast.success(
          `🎉 ${result.convertedCount} lead${result.convertedCount > 1 ? 's' : ''} succesvol geconverteerd!`,
          {
            style: {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
              backdropFilter: 'blur(10px)',
            },
            duration: 4000,
          }
        );
        
        if (result.skippedCount > 0) {
          toast(
            `⚠️ ${result.skippedCount} lead${result.skippedCount > 1 ? 's' : ''} overgeslagen`,
            {
              style: {
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                fontWeight: '600',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
                backdropFilter: 'blur(10px)',
              },
              duration: 3000,
            }
          );
        }
      } else {
        toast.error(
          '❌ Er zijn fouten opgetreden tijdens de conversie',
          {
            style: {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(10px)',
            },
            duration: 4000,
          }
        );
        result.errors.forEach(error => 
          toast.error(error, {
            style: {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              fontWeight: '500',
              borderRadius: '10px',
              border: 'none',
              boxShadow: '0 8px 20px rgba(239, 68, 68, 0.25)',
            },
            duration: 3000,
          })
        );
      }

      // Clear selection and close modal
      setSelectedLeads(new Set());
      setShowManualConversionModal(false);
      
      // Data will automatically refresh due to Convex reactivity

    } catch (error) {
      console.error('Conversion error:', error);
      toast.error(
        `💥 Fout bij conversie: ${error.message}`,
        {
          style: {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            fontWeight: '600',
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(10px)',
          },
          duration: 4000,
        }
      );
    } finally {
      setIsConverting(false);
    }
  };

  // Target audience matching using NEW EXACT system
  const searchTargetAudience = async () => {
    if (!profile?.client_id) {
      toast.error('Geen client ID beschikbaar');
      return;
    }

    setIsSearching(true);
    try {
      const result = await getTargetAudienceLeads({
        functionGroups: targetFunctionGroups.length > 0 ? targetFunctionGroups : undefined,
        industries: targetIndustries.length > 0 ? targetIndustries : undefined,
        countries: targetCountries.length > 0 ? targetCountries : undefined,
        minEmployeeCount: audienceEmployeeMin > 1 ? audienceEmployeeMin : undefined,
        maxEmployeeCount: audienceEmployeeMax < 1000 ? audienceEmployeeMax : undefined,
        maxResults: 1000,
        clientIdentifier: profile.client_id,
      });

      // Map exact lead data to expected format
      const mappedLeads = result.leads.map(lead => ({
        leadId: lead.leadId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        jobTitle: lead.jobTitle,
        functionGroup: lead.functionGroup,
        companyName: lead.companyName,
        industry: lead.industry,
        employeeCount: lead.employeeCount,
        country: lead.country,
        city: lead.city,
        score: 100, // Exact matches get 100% score
        isAlreadyContact: false, // Exact system already filters these out
      }));
      
      setMatchedLeads(mappedLeads);
      toast.success(
        `🎯 ${result.totalMatches} EXACTE matches gevonden!`,
        {
          style: {
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            fontWeight: '600',
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
            backdropFilter: 'blur(10px)',
          },
          duration: 3000,
        }
      );
    } catch (error) {
      console.error('Target audience search error:', error);
      toast.error(
        `🚫 Fout bij zoeken: ${error.message}`,
        {
          style: {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            fontWeight: '600',
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(10px)',
          },
          duration: 4000,
        }
      );
    } finally {
      setIsSearching(false);
    }
  };

  const convertSelectedAudience = async () => {
    if (activeTab === "automation") {
      // Create Smart Conversion automation

      if (!automationName.trim()) {
        toast.error(
          '📝 Vul een naam in voor de automatisering',
          {
            style: {
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
              backdropFilter: 'blur(10px)',
            },
            duration: 3000,
          }
        );
        return;
      }

      if (!dailyLimit || dailyLimit === '' || dailyLimit < 1) {
        toast.error(
          '🔢 Vul een geldig aantal leads per dag in (minimaal 1)',
          {
            style: {
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
              backdropFilter: 'blur(10px)',
            },
            duration: 3000,
          }
        );
        return;
      }

      try {
        setIsConverting(true);
        // Debug logging
        console.log('Creating Smart Conversion with:', {
          name: automationName.trim(),
          clientIdentifier: profile.client_id,
          user: user,
          userEmail: user?.primaryEmailAddress?.emailAddress
        });

        if (!profile.client_id) {
          throw new Error('Geen client ID gevonden. Probeer opnieuw in te loggen.');
        }

        const result = await createSmartConversionAutomation({
          name: automationName.trim(),
          clientIdentifier: profile.client_id,
          targetingCriteria: {
            functionGroups: targetFunctionGroups.length > 0 ? targetFunctionGroups : undefined,
            industries: targetIndustries.length > 0 ? targetIndustries : undefined,
            countries: targetCountries.length > 0 ? targetCountries : undefined,
            minEmployeeCount: audienceEmployeeMin > 1 ? audienceEmployeeMin : undefined,
            maxEmployeeCount: audienceEmployeeMax < 1000 ? audienceEmployeeMax : undefined,
          },
          dailyLimit: parseInt(dailyLimit),
        });

        toast.success(
          `🤖 "${automationName}" ingesteld: ${dailyLimit} leads/dag (draait automatisch elke 6 uur)`,
          {
            style: {
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)',
              backdropFilter: 'blur(10px)',
            },
            duration: 4000,
          }
        );
        setShowConversionModal(false);
        
        // Reset form
        setAutomationName('');
        setTargetFunctionGroups([]);
        setTargetIndustries([]);
        setTargetCountries([]);
        setAudienceEmployeeMin(1);
        setAudienceEmployeeMax(1000);
        setDailyLimit('');
        
      } catch (error) {
        console.error('Error creating Smart Conversion automation:', error);
        toast.error(
          `⚙️ Fout bij aanmaken automatisering: ${error.message}`,
          {
            style: {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(10px)',
            },
            duration: 4000,
          }
        );
      } finally {
        setIsConverting(false);
      }
      return;
    }

    const leadsToConvert = matchedLeads.slice(0, targetAmount);
    if (leadsToConvert.length === 0) {
      toast.error('Geen leads geselecteerd voor conversie');
      return;
    }

    setIsConverting(true);
    try {
      const leadIds = leadsToConvert.map(lead => lead.leadId);
      const result = await convertLeadsToContacts({
        leadIds: leadIds as any[],
        clientIdentifier: profile.client_id,
      });

      if (result.success) {
        toast.success(
          `✨ ${result.convertedCount} lead${result.convertedCount > 1 ? 's' : ''} geconverteerd met exacte matching!`,
          {
            style: {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
              backdropFilter: 'blur(10px)',
            },
            duration: 4000,
          }
        );
        setShowConversionModal(false);
        setMatchedLeads([]);
      } else {
        toast.error(
          '❌ Er zijn fouten opgetreden tijdens de conversie',
          {
            style: {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(10px)',
            },
            duration: 4000,
          }
        );
        result.errors.forEach(error => 
          toast.error(error, {
            style: {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              fontWeight: '500',
              borderRadius: '10px',
              border: 'none',
              boxShadow: '0 8px 20px rgba(239, 68, 68, 0.25)',
            },
            duration: 3000,
          })
        );
      }
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error(
        `💥 Fout bij conversie: ${error.message}`,
        {
          style: {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            fontWeight: '600',
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(10px)',
          },
          duration: 4000,
        }
      );
    } finally {
      setIsConverting(false);
    }
  };

  // Exact same columns as Contacts page
  const columns: ColumnDef<EnrichedContact>[] = [
    {
      accessorKey: "contactpersoon",
      header: "Contactpersoon",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        const initials = `${c.first_name?.[0] || ''}${c.last_name?.[0] || ''}` || 'C';
        const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Naamloos';
        return (
          <div className="flex items-center gap-3 w-[260px]">
            <input type="radio" name="contacts-select" className="h-4 w-4 text-primary" />
            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xs font-medium">
              {c.domain ? (
                <img src={`https://logo.clearbit.com/${c.domain}`} alt="logo" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link to={`/contacts/${(c.contact_id || c.id)}`} className="font-medium text-foreground truncate text-sm hover:underline">
                {fullName}
              </Link>
              <div className="text-xs truncate">
                {c.linkedin_url ? (
                  <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:underline">LinkedIn profiel</a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "functie",
      header: "Functie",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        return (
          <div className="w-[200px]">
            <div className="text-sm font-medium truncate text-foreground/90">{c.job_title || '—'}</div>
            {c.function_group && (
              <Badge variant="secondary" className="mt-1">{c.function_group}</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "bedrijf",
      header: "Bedrijf",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        const url = c.domain || c.website || '';
        return (
          <div className="w-[220px]">
            <Link to={`/accounts/${(c as any).company_id || ''}`} className="text-sm font-medium text-foreground hover:underline truncate block">
              {c.company_name || '—'}
            </Link>
            <div className="text-xs truncate">
              {url ? (
                <a href={`https://${url}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:underline">{url}</a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "industrie",
      header: "Industrie",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        return (
          <div className="w-[200px]">
            <div className="text-sm font-medium text-foreground/90 truncate">{c.industry_label || c.industry || '—'}</div>
            {c.subindustry_label && (
              <Badge variant="secondary" className="mt-1">{c.subindustry_label}</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "aantal_medewerkers",
      header: "Aantal medewerkers",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        // DEBUG: Log what values we have
        console.log(`👥 Employee Count for ${c.first_name} ${c.last_name}:`, {
          company_size: c.company_size,
          employee_count: c.employee_count,
          final_value: c.company_size ?? c.employee_count ?? '—'
        });
        
        const employeeCount = c.company_size ?? c.employee_count;
        const displayValue = employeeCount ? `${employeeCount} medewerkers` : '—';
        
        return <div className="text-sm text-foreground/80">{displayValue}</div>;
      },
    },
    {
      accessorKey: "locatie",
      header: "Locatie",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        // Gebruik bedrijfs-locatie zoals op de bedrijvenpagina; val terug op contactlocatie uit de view
        const parts = [
          c.company_city ?? c.contact_city,
          c.company_state ?? c.contact_state,
          c.company_country ?? c.contact_country,
        ].filter(Boolean) as string[];
        return <div className="text-sm text-foreground/80 truncate max-w-[220px]">{parts.length ? parts.join(', ') : '—'}</div>;
      },
    },
    {
      id: "actie",
      header: "Actie",
      cell: () => (
        <div className="flex justify-end">
          <Button size="sm" className="h-8">Contact</Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: contacts || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!profile?.client_id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">No Access</h2>
          <p className="text-muted-foreground mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-60px)] bg-gray-50 -m-6">
      {/* Left Sidebar - New Design from Screenshot */}
      <div className="w-80 bg-white flex flex-col border-r-2 border-gray-200">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
          <p className="text-sm text-gray-600">{total} exacte matches</p>
        </div>

        {/* Filters Content */}
        <div className="flex-1 px-6 space-y-1 overflow-auto">
          {/* Opgeslagen Filters */}
          <div className="w-full pb-4 border-b-2 border-gray-200">
            <Button 
              variant="outline" 
              className="w-full justify-between h-12 px-4 text-left font-normal"
            >
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-gray-500" />
                <span>Opgeslagen Filters</span>
              </div>
            </Button>
          </div>

          {/* Function Groups */}
          <div className="w-full py-4 border-b-2 border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-12 px-0 text-left font-normal hover:bg-transparent"
              onClick={() => setFunctionGroupOpen(!functionGroupOpen)}
            >
              <span className="text-base font-medium text-gray-900">Functie</span>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </Button>
            {functionGroupOpen && (
              <div className="mt-2 pl-4">
                <MultiSelect
                  options={(filterOptions?.functionGroups || []).map(group => ({ value: group, label: group }))}
                  value={selectedFunctionGroups}
                  onChange={(values) => {
                    setSelectedFunctionGroups(values);
                    setPage(1);
                  }}
                  placeholder="Selecteer function groups..."
                  disabled={filterOptionsLoading}
                />
              </div>
            )}
          </div>

          {/* Aantal medewerkers */}
          <div className="w-full py-4 border-b-2 border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-12 px-0 text-left font-normal hover:bg-transparent"
              onClick={() => setEmployeesOpen(!employeesOpen)}
            >
              <span className="text-base font-medium text-gray-900">Aantal medewerkers</span>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </Button>
            {employeesOpen && (
              <div className="mt-3 pl-4 space-y-3">
                {/* Clean minimal range display */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {employeeMinTextInput || employeeCountMin} - {employeeMaxTextInput || employeeCountMax}
                  </span>
                  <span className="text-xs text-gray-500">medewerkers</span>
                </div>
                
                {/* Elegant slider */}
                <div className="space-y-3 px-1">
                  <Slider
                    value={[employeeCountMin, employeeCountMax]}
                    onValueChange={(values) => {
                      setEmployeeCountMin(values[0]);
                      setEmployeeCountMax(values[1]);
                      setEmployeeMinTextInput('');
                      setEmployeeMaxTextInput('');
                      setPage(1);
                    }}
                    min={1}
                    max={1000}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>1</span>
                    <span>1000</span>
                  </div>
                </div>
                
                {/* Minimal input fields */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={employeeMinTextInput}
                    onChange={(e) => {
                      setEmployeeMinTextInput(e.target.value);
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1 && value <= 1000) {
                        setEmployeeCountMin(value);
                      }
                      setPage(1);
                    }}
                    className="h-9 text-sm"
                  />
                  <div className="w-3 h-px bg-gray-300"></div>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={employeeMaxTextInput}
                    onChange={(e) => {
                      setEmployeeMaxTextInput(e.target.value);
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1 && value <= 1000) {
                        setEmployeeCountMax(value);
                      }
                      setPage(1);
                    }}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Branche */}
          <div className="w-full py-4 border-b-2 border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-12 px-0 text-left font-normal hover:bg-transparent"
              onClick={() => setBrancheOpen(!brancheOpen)}
            >
              <span className="text-base font-medium text-gray-900">Branche</span>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </Button>
            {brancheOpen && (
              <div className="mt-2 pl-4 space-y-4">
                <div>
                  <MultiSelect
                    options={(filteredIndustryOptions?.industries || []).map(industry => ({ value: industry, label: industry }))}
                    value={selectedIndustries}
                    onChange={(values) => {
                      setSelectedIndustries(values);
                      // Reset subbranche when branche changes
                      setSelectedSubindustries([]);
                      setPage(1);
                    }}
                    placeholder="Selecteer branches..."
                    disabled={filterOptionsLoading}
                  />
                </div>
                
                {/* Subbranche - Always visible but locked when no branche selected */}
                <div className="pl-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Subbranche</Label>
                  {selectedIndustries.length === 0 ? (
                    <div className="relative">
                      <MultiSelect
                        options={[]}
                        value={[]}
                        onChange={() => {}}
                        placeholder="Eerst een branche selecteren..."
                        disabled={true}
                      />
                      <div className="absolute inset-0 bg-white/90 rounded-md pointer-events-none flex items-center justify-center border border-gray-200">
                        <span className="text-gray-500 text-sm font-medium">Eerst een branche selecteren</span>
                      </div>
                    </div>
                  ) : (
                    <MultiSelect
                      options={(filteredIndustryOptions?.subindustries || []).map(subindustry => ({ value: subindustry, label: subindustry }))}
                      value={selectedSubindustries}
                      onChange={(values) => {
                        setSelectedSubindustries(values);
                        setPage(1);
                      }}
                      placeholder="Selecteer subbranches..."
                      disabled={filterOptionsLoading}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Locatie */}
          <div className="w-full py-4 border-b-2 border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-12 px-0 text-left font-normal hover:bg-transparent"
              onClick={() => setLocationOpen(!locationOpen)}
            >
              <span className="text-base font-medium text-gray-900">Locatie</span>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </Button>
            {locationOpen && (
              <div className="mt-2 pl-4 space-y-4">
                {/* Land */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Land</Label>
                  <MultiSelect
                    options={(filteredLocationOptions?.countries || []).map(country => ({ value: country, label: country }))}
                    value={selectedCountries}
                    onChange={(values) => {
                      setSelectedCountries(values);
                      // Reset provincie and stad when land changes
                      setSelectedProvinces([]);
                      setSelectedCities([]);
                      setPage(1);
                    }}
                    placeholder="Selecteer landen..."
                    disabled={filterOptionsLoading}
                  />
                </div>
                
                {/* Provincie - Always visible but locked when no land selected */}
                <div className="pl-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Provincie/Staat</Label>
                  {selectedCountries.length === 0 ? (
                    <div className="relative">
                      <MultiSelect
                        options={[]}
                        value={[]}
                        onChange={() => {}}
                        placeholder="Eerst een land selecteren..."
                        disabled={true}
                      />
                      <div className="absolute inset-0 bg-white/90 rounded-md pointer-events-none flex items-center justify-center border border-gray-200">
                        <span className="text-gray-500 text-sm font-medium">Eerst een land selecteren</span>
                      </div>
                    </div>
                  ) : (
                    <MultiSelect
                      options={(filteredLocationOptions?.provinces || []).map(province => ({ value: province, label: province }))}
                      value={selectedProvinces}
                      onChange={(values) => {
                        setSelectedProvinces(values);
                        // Reset stad when provincie changes
                        setSelectedCities([]);
                        setPage(1);
                      }}
                      placeholder="Selecteer provincies..."
                      disabled={filterOptionsLoading}
                    />
                  )}
                </div>
                
                {/* Stad - Always visible but locked when no provincie selected */}
                <div className="pl-8">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Stad</Label>
                  {selectedProvinces.length === 0 ? (
                    <div className="relative">
                      <MultiSelect
                        options={[]}
                        value={[]}
                        onChange={() => {}}
                        placeholder="Eerst een provincie selecteren..."
                        disabled={true}
                      />
                      <div className="absolute inset-0 bg-white/90 rounded-md pointer-events-none flex items-center justify-center border border-gray-200">
                        <span className="text-gray-500 text-sm font-medium">Eerst een provincie selecteren</span>
                      </div>
                    </div>
                  ) : (
                    <MultiSelect
                      options={(filteredLocationOptions?.cities || []).map(city => ({ value: city, label: city }))}
                      value={selectedCities}
                      onChange={(values) => {
                        setSelectedCities(values);
                        setPage(1);
                      }}
                      placeholder="Selecteer steden..."
                      disabled={filterOptionsLoading}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Save Button */}
        <div className="p-6 pt-4">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium">
            <Archive className="w-4 h-4 mr-2" />
            Sla zoekopdracht op
          </Button>
        </div>
      </div>

      {/* Main Content Area - Match Contacts layout exactly */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lead Database</h1>
              <div className="flex items-center gap-4 mt-1">
                <div className="text-sm text-gray-600">{total} exacte matches</div>
                {selectedLeads.size > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                    <Users className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-900">
                      {selectedLeads.size} geselecteerd
                    </span>
                    <button
                      onClick={() => setSelectedLeads(new Set())}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium ml-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Zoek op naam, bedrijf, functie..."
                  className="w-80 pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exporteer
              </Button>
              {selectedLeads.size > 0 && (
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleConvertToContacts}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {selectedLeads.size} Lead{selectedLeads.size > 1 ? 's' : ''} Converteren
                </Button>
              )}
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowConversionModal(true)}
              >
Smart Conversie
              </Button>
            </div>
          </div>
        </div>

        {/* Table Container - Fixed sticky header */}
        <div className="flex-1 overflow-hidden relative min-h-0">
          <div className="h-full overflow-auto">
            <div className="min-w-[1400px] lg:min-w-full">
              <table className="w-full">
                <thead className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
                  <tr>
                    <th className="sticky left-0 z-30 w-[260px] xl:w-[300px] 2xl:w-[350px] px-4 py-2 bg-white text-left text-xs font-medium text-gray-500 uppercase tracking-wide border-r border-gray-200">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={allCurrentPageSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllLeads();
                            } else {
                              deselectAllLeads();
                            }
                          }}
                          className="h-4 w-4"
                          data-indeterminate={someCurrentPageSelected && !allCurrentPageSelected}
                        />
                        <span>Contactpersoon</span>
                      </div>
                    </th>
                    <th className="w-[200px] xl:w-[250px] 2xl:w-[300px] px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Functie
                    </th>
                    <th className="w-[220px] xl:w-[280px] 2xl:w-[320px] px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Bedrijf
                    </th>
                    <th className="w-[200px] xl:w-[250px] 2xl:w-[300px] px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Industrie
                    </th>
                    <th className="w-[120px] xl:w-[150px] 2xl:w-[180px] px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Aantal medewerkers
                    </th>
                    <th className="w-[220px] xl:w-[280px] 2xl:w-[350px] px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Locatie
                    </th>
                    <th className="w-[100px] xl:w-[120px] 2xl:w-[140px] px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Actie
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className={`px-4 py-3 ${j === 0 ? 'sticky left-0 z-10 bg-white border-r border-gray-200' : ''}`}>
                            <div className={`h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded ${j === 0 ? 'w-[200px]' : 'w-full'}`} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : contacts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        Geen resultaten gevonden
                      </td>
                    </tr>
                  ) : (
                    contacts.map((contact) => {
                      const initials = `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase() || 'C';
                      const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Naamloos';
                      const contactId = contact.contact_id || contact.id;
                      const url = contact.domain || contact.website || '';
                      
                      return (
                        <tr key={contactId} className="hover:bg-gray-50 transition-colors group">
                          {/* Contactpersoon - Sticky */}
                          <td className="sticky left-0 z-10 w-[260px] xl:w-[300px] 2xl:w-[350px] px-4 py-3 bg-white group-hover:bg-gray-50 border-r border-gray-200">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedLeads.has(contactId)}
                                onCheckedChange={() => toggleLeadSelection(contactId)}
                                className="h-4 w-4"
                              />
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xs font-medium">
                                {contact.domain ? (
                                  <img src={`https://logo.clearbit.com/${contact.domain}`} alt="logo" className="h-full w-full object-cover" />
                                ) : (
                                  initials
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <Link to={`/contacts/${contactId}`} className="font-medium text-foreground truncate text-sm hover:underline">
                                  {fullName}
                                </Link>
                                <div className="text-xs truncate">
                                  {contact.linkedin_url ? (
                                    <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:underline">LinkedIn profiel</a>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Functie */}
                          <td className="px-4 py-3">
                            <div className="w-[200px] xl:w-[250px] 2xl:w-[300px]">
                              <div className="text-sm font-medium truncate text-foreground/90">{contact.job_title || '—'}</div>
                              {contact.function_group && (
                                <Badge variant="secondary" className="mt-0.5 text-xs">{contact.function_group}</Badge>
                              )}
                            </div>
                          </td>

                          {/* Bedrijf */}
                          <td className="px-4 py-3">
                            <div className="w-[220px] xl:w-[280px] 2xl:w-[320px]">
                              <Link to={`/accounts/${(contact as any).company_id || ''}`} className="text-sm font-medium text-foreground hover:underline truncate block">
                                {contact.company_name || '—'}
                              </Link>
                              <div className="text-xs truncate">
                                {url ? (
                                  <a href={`https://${url}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:underline">{url}</a>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Industrie */}
                          <td className="px-4 py-3">
                            <div className="w-[200px] xl:w-[250px] 2xl:w-[300px]">
                              <div className="text-sm font-medium text-foreground/90 truncate">{contact.industry_label || contact.industry || '—'}</div>
                              {contact.subindustry_label && (
                                <Badge variant="secondary" className="mt-0.5 text-xs">{contact.subindustry_label}</Badge>
                              )}
                            </div>
                          </td>

                          {/* Aantal medewerkers */}
                          <td className="px-4 py-3">
                            <div className="text-sm text-foreground/80">{contact.company_size ?? contact.employee_count ?? '—'}</div>
                          </td>

                          {/* Locatie */}
                          <td className="px-4 py-3">
                            <div className="w-[220px] xl:w-[280px] 2xl:w-[350px]">
                              {(() => {
                                const parts = [
                                  contact.company_city ?? contact.contact_city,
                                  contact.company_state ?? contact.contact_state,
                                  contact.company_country ?? contact.contact_country,
                                ].filter(Boolean) as string[];
                                return <div className="text-sm text-foreground/80 truncate">{parts.length ? parts.join(', ') : '—'}</div>;
                              })()}
                            </div>
                          </td>

                          {/* Actie */}
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <Button size="sm" className="h-7 text-xs">Contact</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sticky Footer Pagination - Improved design */}
        <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm px-6 py-3 min-h-[60px]">
          <div className="w-full flex items-center justify-center">
            <div className="flex items-center gap-6">
              <div className="text-gray-600 font-medium text-sm">
                {Math.min((page-1)*pageSize+1, total)}–{Math.min(page*pageSize, total)} van {total}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" disabled={page<=1} onClick={()=> setPage(p=> Math.max(1, p-1))} className="h-8 px-3 text-sm">Vorige</Button>
                <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages, p+1))} className="h-8 px-3 text-sm">Volgende</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doelgroep Conversie Modal */}
      <Dialog open={showConversionModal} onOpenChange={setShowConversionModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
Smart Conversie
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Definieer je ideale klantprofiel en converteer de best passende leads.
              </DialogDescription>
              
            </DialogHeader>
          </div>

          {/* Tabs Container */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 mx-auto mt-4 max-w-lg flex-shrink-0">
              <TabsTrigger value="direct" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Direct Converteren
              </TabsTrigger>
              <TabsTrigger value="automation" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Automatisering
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="direct" className="flex-1 overflow-y-auto px-8 py-6 space-y-6 mt-0">
              {/* Doelgroep Criteria */}
              <div className="space-y-4">
                {/* Rij 1: Functiegroepen + Aantal werknemers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Functiegroepen</Label>
                    <MultiSelect
                      options={(filterOptions?.functionGroups || []).map(group => ({ value: group, label: group }))}
                      value={targetFunctionGroups}
                      onChange={setTargetFunctionGroups}
                      placeholder="Selecteer..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Bedrijfsgrootte</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={audienceEmployeeMin}
                        onChange={(e) => setAudienceEmployeeMin(parseInt(e.target.value) || 1)}
                        className="h-9 text-sm"
                      />
                      <span className="text-xs text-gray-400">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={audienceEmployeeMax}
                        onChange={(e) => setAudienceEmployeeMax(parseInt(e.target.value) || 1000)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Rij 2: Branche + Subbranche */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Branches</Label>
                    <MultiSelect
                      options={(filteredIndustryOptions?.industries || []).map(industry => ({ value: industry, label: industry }))}
                      value={targetIndustries}
                      onChange={(values) => {
                        setTargetIndustries(values);
                        setSelectedSubindustries([]);
                      }}
                      placeholder="Selecteer branches..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Subbranches</Label>
                    {targetIndustries.length === 0 ? (
                      <div className="relative">
                        <MultiSelect
                          options={[]}
                          value={[]}
                          onChange={() => {}}
                          placeholder="Eerst branche selecteren..."
                          disabled={true}
                        />
                      </div>
                    ) : (
                      <MultiSelect
                        options={(filteredIndustryOptions?.subindustries || []).map(subindustry => ({ value: subindustry, label: subindustry }))}
                        value={selectedSubindustries}
                        onChange={setSelectedSubindustries}
                        placeholder="Selecteer subbranches..."
                      />
                    )}
                  </div>
                </div>

                {/* Rij 3: Land + Provincie */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Landen</Label>
                    <MultiSelect
                      options={(filteredLocationOptions?.countries || []).map(country => ({ value: country, label: country }))}
                      value={targetCountries}
                      onChange={(values) => {
                        setTargetCountries(values);
                        setSelectedProvinces([]);
                        setSelectedCities([]);
                      }}
                      placeholder="Selecteer landen..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Provincies</Label>
                    {targetCountries.length === 0 ? (
                      <div className="relative">
                        <MultiSelect
                          options={[]}
                          value={[]}
                          onChange={() => {}}
                          placeholder="Eerst land selecteren..."
                          disabled={true}
                        />
                      </div>
                    ) : (
                      <MultiSelect
                        options={(filteredLocationOptions?.provinces || []).map(province => ({ value: province, label: province }))}
                        value={selectedProvinces}
                        onChange={setSelectedProvinces}
                        placeholder="Selecteer provincies..."
                      />
                    )}
                  </div>
                </div>
              </div>

            {/* Search Button */}
            <div className="pt-2">
              <Button
                onClick={searchTargetAudience}
                disabled={isSearching}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-medium"
              >
                {isSearching ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Zoeken naar matches...
                  </div>
                ) : (
                  'Vind Passende Leads'
                )}
              </Button>
            </div>

            {/* Results Section - Simplified */}
            {matchedLeads.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                {/* Match Summary Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {matchedLeads.length} Matches Gevonden
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Kwaliteitsleads gerangschikt op match percentage
                      </p>
                    </div>
                    
                    {/* Amount Selector */}
                    <div className="text-right">
                      <Label className="text-xs font-medium text-gray-600 mb-1 block">Te converteren</Label>
                      <Input
                        type="number"
                        min="0"
                        max={matchedLeads.length}
                        value={targetAmount === 0 ? '' : targetAmount}
                        onChange={(e) => setTargetAmount(Math.min(parseInt(e.target.value) || 0, matchedLeads.length))}
                        placeholder="0"
                        className="w-16 h-8 text-sm text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Match Quality Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {matchedLeads.filter(l => l.score >= 80).length}
                    </div>
                    <div className="text-xs text-gray-600">Hoge match (80%+)</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {matchedLeads.filter(l => l.score >= 60 && l.score < 80).length}
                    </div>
                    <div className="text-xs text-gray-600">Goede match (60-80%)</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {matchedLeads.filter(l => l.score < 60).length}
                    </div>
                    <div className="text-xs text-gray-600">Basis match (&lt;60%)</div>
                  </div>
                </div>

              </div>
            )}
          </TabsContent>

            <TabsContent value="automation" className="flex-1 overflow-y-auto px-8 py-6 space-y-6 mt-0">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Automatische Lead Conversie</h3>
                  <p className="text-sm text-gray-600">
                    Stel dagelijkse automatische conversie in met doelgroep criteria
                  </p>
                </div>

                {/* Automation Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Automatisering Naam</Label>
                  <Input
                    type="text"
                    placeholder="Bijv. Marketing Team Lead Conversie"
                    value={automationName}
                    onChange={(e) => setAutomationName(e.target.value)}
                    className="h-10"
                  />
                  <p className="text-xs text-gray-500">Geef je automatisering een herkenbare naam</p>
                </div>

                {/* Doelgroep Criteria */}
                <div className="space-y-4">
                  {/* Rij 1: Functiegroepen + Aantal werknemers */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Functiegroepen</Label>
                      <MultiSelect
                        options={(filterOptions?.functionGroups || []).map(group => ({ value: group, label: group }))}
                        value={targetFunctionGroups}
                        onChange={setTargetFunctionGroups}
                        placeholder="Selecteer..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Bedrijfsgrootte</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={audienceEmployeeMin}
                          onChange={(e) => setAudienceEmployeeMin(parseInt(e.target.value) || 1)}
                          className="h-9 text-sm"
                        />
                        <span className="text-xs text-gray-400">-</span>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={audienceEmployeeMax}
                          onChange={(e) => setAudienceEmployeeMax(parseInt(e.target.value) || 1000)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rij 2: Branche + Subbranche */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Branches</Label>
                      <MultiSelect
                        options={(filteredIndustryOptions?.industries || []).map(industry => ({ value: industry, label: industry }))}
                        value={targetIndustries}
                        onChange={(values) => {
                          setTargetIndustries(values);
                          setSelectedSubindustries([]);
                        }}
                        placeholder="Selecteer branches..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Subbranches</Label>
                      {targetIndustries.length === 0 ? (
                        <div className="relative">
                          <MultiSelect
                            options={[]}
                            value={[]}
                            onChange={() => {}}
                            placeholder="Eerst branche selecteren..."
                            disabled={true}
                          />
                        </div>
                      ) : (
                        <MultiSelect
                          options={(filteredIndustryOptions?.subindustries || []).map(subindustry => ({ value: subindustry, label: subindustry }))}
                          value={selectedSubindustries}
                          onChange={setSelectedSubindustries}
                          placeholder="Selecteer subbranches..."
                        />
                      )}
                    </div>
                  </div>

                  {/* Rij 3: Land + Provincie */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Landen</Label>
                      <MultiSelect
                        options={(filteredLocationOptions?.countries || []).map(country => ({ value: country, label: country }))}
                        value={targetCountries}
                        onChange={(values) => {
                          setTargetCountries(values);
                          setSelectedProvinces([]);
                          setSelectedCities([]);
                        }}
                        placeholder="Selecteer landen..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Provincies</Label>
                      {targetCountries.length === 0 ? (
                        <div className="relative">
                          <MultiSelect
                            options={[]}
                            value={[]}
                            onChange={() => {}}
                            placeholder="Eerst land selecteren..."
                            disabled={true}
                          />
                        </div>
                      ) : (
                        <MultiSelect
                          options={(filteredLocationOptions?.provinces || []).map(province => ({ value: province, label: province }))}
                          value={selectedProvinces}
                          onChange={setSelectedProvinces}
                          placeholder="Selecteer provincies..."
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Automatisering Instellingen */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Automatisering</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Aantal per dag</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={dailyLimit}
                          onChange={(e) => setDailyLimit(e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="h-9"
                        />
                        <span className="text-xs text-gray-500">leads</span>
                      </div>
                    </div>
                    
                  </div>

                  <div className="bg-blue-50 rounded p-3 mt-3">
                    <p className="text-xs text-blue-700">
                      🤖 Het systeem draait automatisch <strong>elke 6 uur</strong> en converteert de beste <strong>{dailyLimit || '[aantal]'} leads</strong> per dag naar contacten.
                    </p>
                  </div>
                </div>

                {/* Bestaande Smart Conversion Automations */}
                {smartConversionAutomations && smartConversionAutomations.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Actieve Smart Conversion Automatiseringen</h4>
                    <div className="space-y-2">
                      {smartConversionAutomations.map((automation) => (
                        <div key={automation._id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {automation.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {automation.dailyLimit} leads om {automation.scheduledTime} • 
                              {automation.totalLeadsConverted || 0} geconverteerd
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${automation.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-xs text-gray-500">
                              {automation.isActive ? 'Actief' : 'Inactief'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

          {/* Footer */}
          <div className="flex-shrink-0 px-8 py-6 bg-gray-50 border-t border-gray-100">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConversionModal(false);
                  setMatchedLeads([]);
                }}
                className="flex-1"
              >
                Annuleren
              </Button>
              {activeTab === "direct" && matchedLeads.length > 0 && targetAmount > 0 && (
                <Button
                  onClick={convertSelectedAudience}
                  disabled={isConverting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                >
                  {isConverting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Converteren...
                    </div>
                  ) : (
                    `Converteer ${targetAmount} Lead${targetAmount > 1 ? 's' : ''}`
                  )}
                </Button>
              )}
              {activeTab === "automation" && (
                <Button
                  onClick={convertSelectedAudience}
                  disabled={isConverting}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-400"
                >
                  {isConverting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Instellen...
                    </div>
                  ) : (
                    'Automatisering Activeren'
                  )}
                </Button>
              )}
            </div>
          </div>
        </Tabs>
        </DialogContent>
      </Dialog>

      {/* Manual Lead Conversion Modal */}
      <Dialog open={showManualConversionModal} onOpenChange={setShowManualConversionModal}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                Leads Converteren naar Contacten
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Geselecteerde leads converteren naar uw contactenlijst voor campagnes.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-6">
            {/* Selection Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-green-600">{selectedLeads.size}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedLeads.size} Lead{selectedLeads.size > 1 ? 's' : ''} Geselecteerd
                    </h3>
                    <p className="text-sm text-gray-600">
                      Klaar voor conversie naar contacten
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Na conversie</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Leads worden toegevoegd aan uw contactenlijst</li>
                      <li>• Beschikbaar voor email en LinkedIn campagnes</li>
                      <li>• Deze actie kan niet ongedaan gemaakt worden</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-8 py-6 bg-gray-50 border-t border-gray-100">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowManualConversionModal(false)}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button
                onClick={performConversion}
                disabled={isConverting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
              >
                {isConverting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Converteren...
                  </div>
                ) : (
                  `${selectedLeads.size} Lead${selectedLeads.size > 1 ? 's' : ''} Converteren`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
