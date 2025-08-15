import { useState } from 'react';

import { Search, Download, ChevronLeft, ChevronRight, Building2, Mail, MapPin, ChevronRight as ChevronRightIcon, Filter, Star, Menu, Users, Briefcase, Globe, Plus, RotateCcw, Archive } from 'lucide-react';
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
import { useConvexAuth } from '@/hooks/useConvexAuth';

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
  const { user } = useConvexAuth();
  // Mock profile data
  const profile = { client_id: 'client-1' };

  // Filter states
  const [selectedFunctionGroups, setSelectedFunctionGroups] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSubindustries, setSelectedSubindustries] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [employeeCount, setEmployeeCount] = useState<number>(1000);
  const [employeeTextInput, setEmployeeTextInput] = useState<string>('');

  // Filter panel states
  const [functionGroupOpen, setFunctionGroupOpen] = useState(false);
  const [employeesOpen, setEmployeesOpen] = useState(false);
  const [brancheOpen, setBrancheOpen] = useState(false);
  const [subbrancheOpen, setSubbrancheOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(25);

  // Mock filter options
  const filterOptions = {
    functionGroups: [
      "Marketing Decision Makers",
      "Sales Decision Makers", 
      "IT Decision Makers",
      "Finance Decision Makers",
      "HR Decision Makers",
      "Operations Decision Makers"
    ],
    industryLabels: [
      "Technology",
      "Software", 
      "Healthcare",
      "Financial Services",
      "Manufacturing",
      "Retail",
      "Education",
      "Professional Services"
    ],
    subindustryLabels: [
      "SaaS",
      "Cloud Services",
      "Cybersecurity",
      "E-commerce",
      "Fintech",
      "Healthcare IT",
      "EdTech",
      "Consulting"
    ],
    locations: [
      "Netherlands",
      "Amsterdam, Netherlands",
      "Rotterdam, Netherlands", 
      "Utrecht, Netherlands",
      "Den Haag, Netherlands",
      "Eindhoven, Netherlands",
      "Tilburg, Netherlands",
      "Groningen, Netherlands"
    ]
  };
  const filterOptionsLoading = false;

  // Mock contact data
  const mockContacts: EnrichedContact[] = [
    {
      id: "1",
      contact_id: "c1",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      mobile_phone: "+31612345678",
      status: "cold",
      company_name: "Example Corp",
      domain: "example.com",
      website: "example.com",
      linkedin_url: "https://linkedin.com/in/johndoe",
      job_title: "Marketing Manager",
      function_group: "Marketing Decision Makers",
      industry: "Technology",
      industry_label: "Software",
      subindustry_label: "SaaS",
      employee_count: 150,
      company_size: 150,
      city: "Amsterdam",
      state: "Noord-Holland", 
      country: "Netherlands",
      company_city: "Amsterdam",
      company_state: "Noord-Holland",
      company_country: "Netherlands",
      contact_city: "Amsterdam",
      contact_state: "Noord-Holland", 
      contact_country: "Netherlands"
    },
    {
      id: "2",
      contact_id: "c2",
      first_name: "Jane",
      last_name: "Smith", 
      email: "jane.smith@techcorp.com",
      mobile_phone: "+31687654321",
      status: "warm",
      company_name: "TechCorp",
      domain: "techcorp.com",
      website: "techcorp.com",
      linkedin_url: "https://linkedin.com/in/janesmith",
      job_title: "Sales Director",
      function_group: "Sales Decision Makers",
      industry: "Technology",
      industry_label: "Technology",
      subindustry_label: "Cloud Services",
      employee_count: 500,
      company_size: 500,
      city: "Rotterdam",
      state: "Zuid-Holland",
      country: "Netherlands", 
      company_city: "Rotterdam",
      company_state: "Zuid-Holland",
      company_country: "Netherlands",
      contact_city: "Rotterdam",
      contact_state: "Zuid-Holland",
      contact_country: "Netherlands"
    }
  ];

  const rawData = {
    data: mockContacts,
    count: mockContacts.length,
    page,
    pageSize,
    totalPages: Math.ceil(mockContacts.length / pageSize)
  };

  // Apply additional filters client-side for now
  const data = (() => {
    let filteredData = [...mockContacts];
    
    if (selectedFunctionGroups.length > 0) {
      filteredData = filteredData.filter(contact => 
        selectedFunctionGroups.includes(contact.function_group || '')
      );
    }
    
    if (selectedIndustries.length > 0) {
      filteredData = filteredData.filter(contact => 
        selectedIndustries.includes(contact.industry_label || contact.industry || '')
      );
    }

    if (selectedSubindustries.length > 0) {
      filteredData = filteredData.filter(contact => 
        selectedSubindustries.includes(contact.subindustry_label || '')
      );
    }

    if (selectedLocations.length > 0) {
      filteredData = filteredData.filter(contact => {
        // Build location strings for this contact (same logic as in location data processing)
        const locationStrings = new Set<string>();
        
        // Company location
        if (contact.company_city && contact.company_country) {
          locationStrings.add(`${contact.company_city}, ${contact.company_country}`);
        }
        if (contact.company_country) {
          locationStrings.add(contact.company_country);
        }
        
        // Contact location as fallback
        if (contact.contact_city && contact.contact_country) {
          locationStrings.add(`${contact.contact_city}, ${contact.contact_country}`);
        }
        if (contact.contact_country) {
          locationStrings.add(contact.contact_country);
        }
        
        // General location fields
        if (contact.city && contact.country) {
          locationStrings.add(`${contact.city}, ${contact.country}`);
        }
        if (contact.country) {
          locationStrings.add(contact.country);
        }
        
        // Check if any of the contact's locations match selected locations
        return selectedLocations.some(selectedLoc => 
          [...locationStrings].some(contactLoc => contactLoc.includes(selectedLoc) || selectedLoc.includes(contactLoc))
        );
      });
    }
    
    // Filter by employee count (use text input if provided, otherwise slider value)
    const targetEmployeeCount = employeeTextInput ? parseInt(employeeTextInput) : employeeCount;
    if (targetEmployeeCount > 0) {
      filteredData = filteredData.filter(contact => {
        const size = contact.company_size || contact.employee_count || 0;
        return size <= targetEmployeeCount;
      });
    }
    
    return {
      data: filteredData,
      count: filteredData.length
    };
  })();

  const isLoading = false;
  
  const contacts: EnrichedContact[] = (data as any)?.data ?? []
  const total = (data as any)?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const resetFilters = () => {
    setSearch('');
    setSelectedFunctionGroups([]);
    setSelectedIndustries([]);
    setSelectedSubindustries([]);
    setSelectedLocations([]);
    setEmployeeCount(1000);
    setEmployeeTextInput('');
    setPage(1);
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
        return <div className="text-sm text-foreground/80">{c.company_size ?? c.employee_count ?? '—'}</div>;
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
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - New Design from Screenshot */}
      <div className="w-80 bg-white flex flex-col">
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
          <p className="text-sm text-gray-600">{total} leads gevonden</p>
        </div>

        {/* Filters Content */}
        <div className="flex-1 px-6 space-y-4 overflow-auto">
          {/* Opgeslagen Filters */}
          <div className="w-full">
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
          <div className="w-full">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-12 px-0 text-left font-normal hover:bg-transparent"
              onClick={() => setFunctionGroupOpen(!functionGroupOpen)}
            >
              <span className="text-base font-medium text-gray-900">Function Groups</span>
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
          <div className="w-full">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-12 px-0 text-left font-normal hover:bg-transparent"
              onClick={() => setEmployeesOpen(!employeesOpen)}
            >
              <span className="text-base font-medium text-gray-900">Aantal medewerkers</span>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </Button>
            {employeesOpen && (
              <div className="mt-2 space-y-4 pl-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max aantal medewerkers: {employeeTextInput || employeeCount}</Label>
                  <Slider
                    value={[employeeCount]}
                    onValueChange={(values) => {
                      setEmployeeCount(values[0]);
                      setEmployeeTextInput(''); // Clear text input when using slider
                      setPage(1);
                    }}
                    min={1}
                    max={1000}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">1</span>
                    <div className="flex-1"></div>
                    <span className="text-xs text-gray-500">1000</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-text-input" className="text-sm font-medium">Of voer exact aantal in:</Label>
                  <Input
                    id="employee-text-input"
                    type="number"
                    min="1"
                    placeholder="Bijv. 250"
                    value={employeeTextInput}
                    onChange={(e) => {
                      setEmployeeTextInput(e.target.value);
                      setPage(1);
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Branche */}
          <div className="w-full">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-12 px-0 text-left font-normal hover:bg-transparent"
              onClick={() => setBrancheOpen(!brancheOpen)}
            >
              <span className="text-base font-medium text-gray-900">Branche</span>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </Button>
            {brancheOpen && (
              <div className="mt-2 pl-4">
                <MultiSelect
                  options={(filterOptions?.industryLabels || []).map(industry => ({ value: industry, label: industry }))}
                  value={selectedIndustries}
                  onChange={(values) => {
                    setSelectedIndustries(values);
                    setPage(1);
                  }}
                  placeholder="Selecteer branches..."
                  disabled={filterOptionsLoading}
                />
              </div>
            )}
          </div>

          {/* Subbranche */}
          <div className="w-full">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-12 px-0 text-left font-normal hover:bg-transparent"
              onClick={() => setSubbrancheOpen(!subbrancheOpen)}
            >
              <span className="text-base font-medium text-gray-900">Subbranche</span>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </Button>
            {subbrancheOpen && (
              <div className="mt-2 pl-4">
                <MultiSelect
                  options={(filterOptions?.subindustryLabels || []).map(subindustry => ({ value: subindustry, label: subindustry }))}
                  value={selectedSubindustries}
                  onChange={(values) => {
                    setSelectedSubindustries(values);
                    setPage(1);
                  }}
                  placeholder="Selecteer subbranches..."
                  disabled={filterOptionsLoading}
                />
              </div>
            )}
          </div>

          {/* Locatie */}
          <div className="w-full">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-12 px-0 text-left font-normal hover:bg-transparent"
              onClick={() => setLocationOpen(!locationOpen)}
            >
              <span className="text-base font-medium text-gray-900">Locatie</span>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </Button>
            {locationOpen && (
              <div className="mt-2 pl-4">
                <MultiSelect
                  options={(filterOptions?.locations || []).map(location => ({ value: location, label: location }))}
                  value={selectedLocations}
                  onChange={(values) => {
                    setSelectedLocations(values);
                    setPage(1);
                  }}
                  placeholder="Selecteer locaties..."
                  disabled={filterOptionsLoading}
                />
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
              <div className="text-sm text-gray-600 mt-1">{total} leads gevonden</div>
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
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Converteren naar contacten
              </Button>
            </div>
          </div>
        </div>

        {/* Table Container - Fixed sticky header */}
        <div className="flex-1 overflow-hidden relative">
          <div className="h-full overflow-auto">
            <div className="min-w-full">
              <table className="w-full">
                <thead className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
                  <tr>
                    <th className="sticky left-0 z-30 w-[260px] px-4 py-3 bg-white text-left text-xs font-medium text-gray-500 uppercase tracking-wide border-r border-gray-200">
                      Contactpersoon
                    </th>
                    <th className="w-[200px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Functie
                    </th>
                    <th className="w-[220px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Bedrijf
                    </th>
                    <th className="w-[200px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Industrie
                    </th>
                    <th className="w-[120px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Aantal medewerkers
                    </th>
                    <th className="w-[220px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Locatie
                    </th>
                    <th className="w-[100px] px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Actie
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className={`px-4 py-4 ${j === 0 ? 'sticky left-0 z-10 bg-white border-r border-gray-200' : ''}`}>
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
                          <td className="sticky left-0 z-10 w-[260px] px-4 py-4 bg-white group-hover:bg-gray-50 border-r border-gray-200">
                            <div className="flex items-center gap-3">
                              <input type="radio" name="contacts-select" className="h-4 w-4 text-primary" />
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
                          <td className="px-4 py-4">
                            <div className="w-[200px]">
                              <div className="text-sm font-medium truncate text-foreground/90">{contact.job_title || '—'}</div>
                              {contact.function_group && (
                                <Badge variant="secondary" className="mt-1">{contact.function_group}</Badge>
                              )}
                            </div>
                          </td>

                          {/* Bedrijf */}
                          <td className="px-4 py-4">
                            <div className="w-[220px]">
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
                          <td className="px-4 py-4">
                            <div className="w-[200px]">
                              <div className="text-sm font-medium text-foreground/90 truncate">{contact.industry_label || contact.industry || '—'}</div>
                              {contact.subindustry_label && (
                                <Badge variant="secondary" className="mt-1">{contact.subindustry_label}</Badge>
                              )}
                            </div>
                          </td>

                          {/* Aantal medewerkers */}
                          <td className="px-4 py-4">
                            <div className="text-sm text-foreground/80">{contact.company_size ?? contact.employee_count ?? '—'}</div>
                          </td>

                          {/* Locatie */}
                          <td className="px-4 py-4">
                            <div className="w-[220px]">
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
                          <td className="px-4 py-4">
                            <div className="flex justify-end">
                              <Button size="sm" className="h-8">Contact</Button>
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

        {/* Sticky Footer Pagination - Exact same as Contacts */}
        <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="text-muted-foreground font-medium">
              <div>
                {Math.min((page-1)*pageSize+1, total)}–{Math.min(page*pageSize, total)} van {total}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page<=1} onClick={()=> setPage(p=> Math.max(1, p-1))} className="h-8">Vorige</Button>
              <span>{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages, p+1))} className="h-8">Volgende</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
