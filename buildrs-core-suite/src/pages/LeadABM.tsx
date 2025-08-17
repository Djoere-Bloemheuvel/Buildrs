import { useState, useMemo } from 'react';
import { useQuery as useConvexQuery } from 'convex/react';
import { useMutation } from 'convex/react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useConvexAuth } from '@/hooks/useConvexAuth';
import { api } from '../../convex/_generated/api';
import {
  Search,
  Plus,
  Target,
  TrendingUp,
  Users,
  Building2,
  Globe,
  Activity,
  PlayCircle,
  PauseCircle,
  Eye,
  BarChart3,
  Filter,
  Download,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Settings,
  Brain,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
} from 'lucide-react';
import PropositionSelect from '@/components/lead/PropositionSelect';

// Types
type AbmCandidate = {
  company_id: string;
  company_name: string;
  industry?: string | null;
  company_size?: number | null;
  company_country?: string | null;
  company_state?: string | null;
  company_city?: string | null;
  decision_maker_count?: number | null;
  last_communication_at?: string | null;
  status?: string | null;
};

type Campaign = {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    meetings_booked: number;
    opportunities_created: number;
    pipeline_value: number;
  };
  target_accounts: number;
  proposition_id?: string;
  description?: string;
};

// Mock Data
const mockAbmCandidates: AbmCandidate[] = [
  {
    company_id: '1',
    company_name: 'TechCorp Solutions',
    industry: 'Technology',
    company_size: 250,
    company_country: 'Netherlands',
    company_state: 'Noord-Holland',
    company_city: 'Amsterdam',
    decision_maker_count: 4,
    last_communication_at: '2024-01-15T10:30:00Z',
    status: 'active'
  },
  {
    company_id: '2',
    company_name: 'InnovatePay',
    industry: 'Financial Services',
    company_size: 180,
    company_country: 'Netherlands',
    company_state: 'Zuid-Holland',
    company_city: 'Rotterdam',
    decision_maker_count: 3,
    last_communication_at: null,
    status: 'prospect'
  },
  {
    company_id: '3',
    company_name: 'HealthFirst Medical',
    industry: 'Healthcare',
    company_size: 420,
    company_country: 'Belgium',
    company_state: 'Brussels',
    company_city: 'Brussels',
    decision_maker_count: 6,
    last_communication_at: '2024-02-08T14:20:00Z',
    status: 'nurture'
  },
  {
    company_id: '4',
    company_name: 'GreenEnergy Co',
    industry: 'Renewable Energy',
    company_size: 95,
    company_country: 'Netherlands',
    company_state: 'Utrecht',
    company_city: 'Utrecht',
    decision_maker_count: 2,
    last_communication_at: '2024-01-28T09:15:00Z',
    status: 'active'
  },
  {
    company_id: '5',
    company_name: 'DataDriven Analytics',
    industry: 'Technology',
    company_size: 75,
    company_country: 'Germany',
    company_state: 'Berlin',
    company_city: 'Berlin',
    decision_maker_count: 3,
    last_communication_at: null,
    status: 'prospect'
  },
  {
    company_id: '6',
    company_name: 'EcoLogistics',
    industry: 'Transportation',
    company_size: 320,
    company_country: 'Netherlands',
    company_state: 'Gelderland',
    company_city: 'Arnhem',
    decision_maker_count: 5,
    last_communication_at: '2024-02-12T16:45:00Z',
    status: 'engaged'
  }
];

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Tech Leaders Q1 2024',
    status: 'active',
    created_at: '2024-01-10T08:00:00Z',
    stats: {
      sent: 125,
      opened: 89,
      clicked: 34,
      replied: 18,
      meetings_booked: 7,
      opportunities_created: 3,
      pipeline_value: 285000
    },
    target_accounts: 50,
    proposition_id: 'prop-1',
    description: 'Targeting tech companies for digital transformation solutions'
  },
  {
    id: '2',
    name: 'Healthcare Innovation',
    status: 'active',
    created_at: '2024-01-20T09:30:00Z',
    stats: {
      sent: 78,
      opened: 56,
      clicked: 21,
      replied: 12,
      meetings_booked: 4,
      opportunities_created: 2,
      pipeline_value: 180000
    },
    target_accounts: 25,
    proposition_id: 'prop-2',
    description: 'Healthcare digitization and compliance solutions'
  },
  {
    id: '3',
    name: 'FinTech Outreach',
    status: 'paused',
    created_at: '2024-02-01T11:15:00Z',
    stats: {
      sent: 45,
      opened: 32,
      clicked: 15,
      replied: 8,
      meetings_booked: 2,
      opportunities_created: 1,
      pipeline_value: 95000
    },
    target_accounts: 20,
    proposition_id: 'prop-3',
    description: 'Financial services automation and security'
  },
  {
    id: '4',
    name: 'Sustainability Focus',
    status: 'completed',
    created_at: '2023-12-15T14:00:00Z',
    stats: {
      sent: 156,
      opened: 112,
      clicked: 67,
      replied: 28,
      meetings_booked: 12,
      opportunities_created: 8,
      pipeline_value: 420000
    },
    target_accounts: 60,
    proposition_id: 'prop-4',
    description: 'Green technology and sustainability solutions'
  },
  {
    id: '5',
    name: 'SME Growth Initiative',
    status: 'draft',
    created_at: '2024-02-15T10:00:00Z',
    stats: {
      sent: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      meetings_booked: 0,
      opportunities_created: 0,
      pipeline_value: 0
    },
    target_accounts: 35,
    proposition_id: 'prop-5',
    description: 'Small and medium enterprise growth solutions'
  }
];

export default function LeadABM() {
  const { user, getClientId } = useConvexAuth();
  const clientId = getClientId();
  const { toast } = useToast();

  // State
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AbmCandidate | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Campaign creation form
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    proposition_id: '',
    target_filter: {
      industry: '',
      company_size_min: '',
      company_size_max: '',
      country: '',
    },
  });

  // Fetch ABM candidates using Convex
  const candidatesData = useConvexQuery(api.candidateViews.abmCandidates, 
    clientId ? { 
      clientId,
      minCompanySize: 25,
      excludeDoNotContact: true 
    } : 'skip'
  );

  // Add error handling
  const candidatesError = candidatesData === null;

  // Debug logging
  console.log('🔍 ABM Debug:', {
    clientId,
    candidatesData,
    candidatesDataType: typeof candidatesData,
    candidatesDataLength: candidatesData?.length,
    isArray: Array.isArray(candidatesData)
  });

  // Transform Convex data to match expected format
  const transformedCandidatesData = useMemo(() => {
    if (!candidatesData || !Array.isArray(candidatesData)) {
      console.log('⚠️ No candidates data or not array, using mock data:', candidatesData);
      // Fallback to mock data for demonstration
      let filteredMockAccounts = mockAbmCandidates.map(mock => ({
        company_id: mock.company_id,
        company_name: mock.company_name,
        industry: mock.industry,
        company_size: mock.company_size,
        company_country: mock.company_country,
        company_state: mock.company_state,
        company_city: mock.company_city,
        decision_maker_count: mock.decision_maker_count,
        last_communication_at: mock.last_communication_at,
        status: mock.status
      }));

      // Apply search filter to mock data
      if (search) {
        const searchLower = search.toLowerCase();
        filteredMockAccounts = filteredMockAccounts.filter(candidate => 
          candidate.company_name.toLowerCase().includes(searchLower) ||
          candidate.industry?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply pagination to mock data
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedMockAccounts = filteredMockAccounts.slice(from, to);
      
      return { 
        accounts: paginatedMockAccounts, 
        total: filteredMockAccounts.length 
      };
    }
    
    console.log('✅ Using real Convex data:', candidatesData.length, 'candidates');
    
    let filteredAccounts = candidatesData.map(candidate => ({
      company_id: candidate.companyId,
      company_name: candidate.companyName || 'Unknown Company',
      industry: candidate.industryLabel,
      company_size: candidate.companySize,
      company_country: candidate.companyCountry,
      company_state: candidate.companyState,
      company_city: candidate.companyCity,
      decision_maker_count: candidate.decisionMakerCount,
      last_communication_at: candidate.lastCommunicationAt ? new Date(candidate.lastCommunicationAt).toISOString() : null,
      status: 'active'
    }));

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAccounts = filteredAccounts.filter(candidate => 
        candidate.company_name.toLowerCase().includes(searchLower) ||
        candidate.industry?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const paginatedAccounts = filteredAccounts.slice(from, to);
    
    return { 
      accounts: paginatedAccounts, 
      total: filteredAccounts.length 
    };
  }, [candidatesData, search, page, pageSize]);

  const candidatesLoading = candidatesData === undefined;

  // Use mock campaigns data for now (can be replaced with Convex query later)
  const campaigns = mockCampaigns;
  const campaignsLoading = false;

  // Campaign stats aggregation
  const campaignStats = useMemo(() => {
    if (!campaigns) return null;
    
    const total = campaigns.length;
    const active = campaigns.filter(c => c.status === 'active').length;
    const totalSent = campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + (c.stats?.opened || 0), 0);
    const totalReplied = campaigns.reduce((sum, c) => sum + (c.stats?.replied || 0), 0);
    const totalPipelineValue = campaigns.reduce((sum, c) => sum + (c.stats?.pipeline_value || 0), 0);
    
    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';
    const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : '0';

    return {
      total,
      active,
      totalSent,
      openRate: parseFloat(openRate),
      replyRate: parseFloat(replyRate),
      totalPipelineValue,
    };
  }, [campaigns]);

  // Create campaign function (placeholder for future Convex mutation)
  const createCampaign = async (formData: typeof campaignForm) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful campaign creation
      toast({ 
        title: 'Campaign created successfully', 
        description: 'Your ABM campaign has been created and is ready to launch.' 
      });
      setIsCreateCampaignOpen(false);
      setCampaignForm({
        name: '',
        description: '',
        proposition_id: '',
        target_filter: { industry: '', company_size_min: '', company_size_max: '', country: '' },
      });
    } catch (error: any) {
      toast({ 
        title: 'Failed to create campaign', 
        description: error.message || 'Something went wrong.', 
        variant: 'destructive' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Modern Header */}
      <div className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-40 -ml-6 w-[102.5%] -mt-6">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                Account-Based Marketing
              </h1>
              <p className="text-slate-600 mt-1 font-medium">
                Richt je op waardevolle bedrijven met gepersonaliseerde campagnes
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Zoek bedrijven, campagnes..."
                  className="pl-10 w-80 h-11 bg-white/60 border-slate-200 focus:bg-white"
                />
              </div>
              <Button 
                onClick={() => setIsCreateCampaignOpen(true)}
                className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe Campagne
              </Button>
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
              <TabsTrigger value="accounts" className="h-10 px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Building2 className="w-4 h-4 mr-2" />
                Doelbedrijven
              </TabsTrigger>
              <TabsTrigger value="analytics" className="h-10 px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="h-10 px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Brain className="w-4 h-4 mr-2" />
                Automatisering
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      <div className="py-8">
        <Tabs value={selectedTab} className="w-full">
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-blue-100">Actieve Campagnes</CardTitle>
                    <Activity className="w-5 h-5 text-blue-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{campaignStats?.active || 0}</div>
                  <p className="text-blue-200 text-sm">van {campaignStats?.total || 0} totaal</p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-emerald-100">Berichten Verzonden</CardTitle>
                    <Mail className="w-5 h-5 text-emerald-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{campaignStats?.totalSent || 0}</div>
                  <p className="text-emerald-200 text-sm">alle campagnes samen</p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-orange-100">Reactiepercentage</CardTitle>
                    <TrendingUp className="w-5 h-5 text-orange-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{campaignStats?.replyRate || 0}%</div>
                  <p className="text-orange-200 text-sm">gemiddeld reactiepercentage</p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-purple-100">Pipeline Waarde</CardTitle>
                    <Zap className="w-5 h-5 text-purple-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(campaignStats?.totalPipelineValue || 0)}</div>
                  <p className="text-purple-200 text-sm">gegenereerde omzet</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Campaigns */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Actieve Campagnes</h2>
                  <p className="text-slate-600">Lopende account-based marketing campagnes</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filteren
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exporteren
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {campaignsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-white/80 backdrop-blur-sm border rounded-lg p-6 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-32"></div>
                            <div className="h-3 bg-slate-200 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="flex space-x-8">
                          <div className="h-4 bg-slate-200 rounded w-16"></div>
                          <div className="h-4 bg-slate-200 rounded w-16"></div>
                          <div className="h-4 bg-slate-200 rounded w-16"></div>
                          <div className="h-4 bg-slate-200 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : campaigns?.filter(campaign => campaign.status === 'active').map((campaign) => (
                  <div key={campaign.id} className="bg-white/80 backdrop-blur-sm border rounded-lg p-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-sm font-semibold">
                            {campaign.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 truncate">{campaign.name}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <Badge className={`${getStatusColor(campaign.status)} border text-xs`}>
                              {campaign.status}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              {new Date(campaign.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-slate-500">
                              {campaign.target_accounts} target accounts
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-8 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-slate-900">{campaign.stats.sent}</div>
                          <div className="text-slate-500">Verzonden</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-slate-900">
                            {campaign.stats.sent > 0 ? `${((campaign.stats.opened / campaign.stats.sent) * 100).toFixed(1)}%` : '0%'}
                          </div>
                          <div className="text-slate-500">Openingspercentage</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-slate-900">
                            {campaign.stats.sent > 0 ? `${((campaign.stats.replied / campaign.stats.sent) * 100).toFixed(1)}%` : '0%'}
                          </div>
                          <div className="text-slate-500">Reactiepercentage</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-slate-900">{campaign.stats.meetings_booked}</div>
                          <div className="text-slate-500">Afspraken</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-slate-900">{formatCurrency(campaign.stats.pipeline_value || 0)}</div>
                          <div className="text-slate-500">Pipeline</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-6">
                        <Button variant="outline" size="sm">
                          <PauseCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>


          {/* Target Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Doelbedrijven</h2>
                <p className="text-slate-600">Waardevolle bedrijven geschikt voor ABM campagnes</p>
              </div>
              <div className="flex items-center gap-3">
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Branches</SelectItem>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Meer Filters
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {candidatesLoading ? (
                Array.from({ length: 9 }).map((_, i) => (
                  <Card key={i} className="border-0 shadow-lg animate-pulse">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-32"></div>
                          <div className="h-3 bg-slate-200 rounded w-24"></div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              ) : transformedCandidatesData?.accounts.map((account) => (
                <Card 
                  key={account.company_id} 
                  className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/80 backdrop-blur-sm cursor-pointer"
                  onClick={() => {
                    setSelectedAccount(account);
                    setIsAccountDetailsOpen(true);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={`https://logo.clearbit.com/${account.company_name.toLowerCase().replace(/\s+/g, '')}.com`} />
                          <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                            {account.company_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-slate-900">{account.company_name}</div>
                          <div className="text-sm text-slate-600">{account.industry || 'Unknown Industry'}</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-slate-600">
                          <Users className="w-4 h-4 mr-1" />
                          Bedrijfsgrootte
                        </div>
                        <Badge variant="secondary">
                          {account.company_size ? `${account.company_size.toLocaleString()}` : 'Onbekend'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-slate-600">
                          <MapPin className="w-4 h-4 mr-1" />
                          Locatie
                        </div>
                        <span className="text-slate-900 font-medium">
                          {[account.company_city, account.company_country].filter(Boolean).join(', ') || 'Onbekend'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-slate-600">
                          <Target className="w-4 h-4 mr-1" />
                          Besluitvormers
                        </div>
                        <Badge variant={account.decision_maker_count && account.decision_maker_count > 0 ? "default" : "secondary"}>
                          {account.decision_maker_count || 0}
                        </Badge>
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          size="sm" 
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add to campaign logic
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Toevoegen aan Campagne
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-20">
              <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Analytics Dashboard</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                Detailed analytics and reporting features are coming soon. Track campaign performance, 
                account engagement, and ROI metrics.
              </p>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">ABM Automatisering</h2>
                <p className="text-slate-600">Configureer intelligente automatiseringen voor je account-based marketing</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Campaign Defaults */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Campagne Standaarden
                    </CardTitle>
                    <CardDescription>
                      Standaard instellingen voor nieuwe ABM campagnes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="default-company-size">Minimale bedrijfsgrootte</Label>
                      <Input
                        id="default-company-size"
                        type="number"
                        placeholder="25"
                        defaultValue="25"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="default-decision-makers">Minimaal aantal decision makers</Label>
                      <Input
                        id="default-decision-makers"
                        type="number"
                        placeholder="2"
                        defaultValue="2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default-regions">Standaard regio's</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer regio's" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nl">Nederland</SelectItem>
                          <SelectItem value="be">België</SelectItem>
                          <SelectItem value="de">Duitsland</SelectItem>
                          <SelectItem value="eu">Europa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default-industries">Voorkeur branches</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer branches" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tech">Technology</SelectItem>
                          <SelectItem value="finance">Financial Services</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Automation Settings */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-600" />
                      Automatisering
                    </CardTitle>
                    <CardDescription>
                      Automatische account identificatie en campagne toewijzing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Auto-identificatie van target accounts</Label>
                        <p className="text-sm text-slate-500">
                          Automatisch nieuwe target accounts identificeren
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Smart campagne toewijzing</Label>
                        <p className="text-sm text-slate-500">
                          Accounts automatisch toewijzen aan beste campagne
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="check-frequency">Controle frequentie</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer frequentie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Dagelijks</SelectItem>
                          <SelectItem value="weekly">Wekelijks</SelectItem>
                          <SelectItem value="monthly">Maandelijks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="auto-limit">Max. accounts per dag</Label>
                      <Input
                        id="auto-limit"
                        type="number"
                        placeholder="10"
                        defaultValue="10"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Communication Preferences */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-green-600" />
                      Communicatie Voorkeuren
                    </CardTitle>
                    <CardDescription>
                      Timing en frequentie instellingen voor outreach
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Cooldown periode na communicatie</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-slate-500">0-2 campagnes</Label>
                          <Input placeholder="30 dagen" defaultValue="30" />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-500">3-4 campagnes</Label>
                          <Input placeholder="45 dagen" defaultValue="45" />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-500">5-6 campagnes</Label>
                          <Input placeholder="60 dagen" defaultValue="60" />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-500">7+ campagnes</Label>
                          <Input placeholder="90 dagen" defaultValue="90" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Respecteer 'Do Not Contact' status</Label>
                        <p className="text-sm text-slate-500">
                          Automatisch contacts met DNC status uitsluiten
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-touchpoints">Max. touchpoints per account</Label>
                      <Input
                        id="max-touchpoints"
                        type="number"
                        placeholder="5"
                        defaultValue="5"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Quality & Enrichment */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Data Kwaliteit
                    </CardTitle>
                    <CardDescription>
                      Instellingen voor data verrijking en kwaliteitscontrole
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Alleen volledig verrijkte bedrijven</Label>
                        <p className="text-sm text-slate-500">
                          Werk alleen met bedrijven met volledige data verrijking
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Automatische data verrijking</Label>
                        <p className="text-sm text-slate-500">
                          Nieuwe accounts automatisch verrijken bij toevoeging
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enrichment-priority">Verrijking prioriteit</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer prioriteit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">Hoog - Binnen 24 uur</SelectItem>
                          <SelectItem value="medium">Gemiddeld - Binnen 48 uur</SelectItem>
                          <SelectItem value="low">Laag - Binnen een week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data-sources">Data bronnen</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="apollo" defaultChecked />
                          <Label htmlFor="apollo">Apollo</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="linkedin" defaultChecked />
                          <Label htmlFor="linkedin">LinkedIn Sales Navigator</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="clearbit" />
                          <Label htmlFor="clearbit">Clearbit</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Save Actions */}
              <div className="flex justify-end space-x-4 pt-8 border-t">
                <Button variant="outline">
                  Annuleren
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Instellingen Opslaan
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>

    {/* Create Campaign Dialog */}
      <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] bg-background/95 backdrop-blur-xl border-0 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 pb-6">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-white">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              Nieuwe ABM Campagne
            </DialogTitle>
            <p className="text-blue-100 mt-2">
              Stel een nieuwe account-based marketing campagne op om waardevolle bedrijven te targeten
            </p>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-220px)] pr-6">
            <div className="space-y-8 px-8 py-6">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campagne Naam</Label>
              <Input
                id="campaign-name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Voer campagne naam in"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-description">Beschrijving</Label>
              <Textarea
                id="campaign-description"
                value={campaignForm.description}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beschrijf je campagne doelen en strategie"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Propositie</Label>
              <PropositionSelect 
                value={campaignForm.proposition_id || undefined}
                onChange={(id) => setCampaignForm(prev => ({ ...prev, proposition_id: id || '' }))}
              />
            </div>

            <div className="space-y-4">
              <Label>Doelbedrijf Filters</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Branche</Label>
                  <Input
                    id="industry"
                    value={campaignForm.target_filter.industry}
                    onChange={(e) => setCampaignForm(prev => ({
                      ...prev,
                      target_filter: { ...prev.target_filter, industry: e.target.value }
                    }))}
                    placeholder="bijv. Technologie"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Land</Label>
                  <Input
                    id="country"
                    value={campaignForm.target_filter.country}
                    onChange={(e) => setCampaignForm(prev => ({
                      ...prev,
                      target_filter: { ...prev.target_filter, country: e.target.value }
                    }))}
                    placeholder="bijv. Nederland"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size-min">Min. Bedrijfsgrootte</Label>
                  <Input
                    id="size-min"
                    type="number"
                    value={campaignForm.target_filter.company_size_min}
                    onChange={(e) => setCampaignForm(prev => ({
                      ...prev,
                      target_filter: { ...prev.target_filter, company_size_min: e.target.value }
                    }))}
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size-max">Max. Bedrijfsgrootte</Label>
                  <Input
                    id="size-max"
                    type="number"
                    value={campaignForm.target_filter.company_size_max}
                    onChange={(e) => setCampaignForm(prev => ({
                      ...prev,
                      target_filter: { ...prev.target_filter, company_size_max: e.target.value }
                    }))}
                    placeholder="e.g. 500"
                  />
                </div>
              </div>
            </div>
            </div>
          </ScrollArea>

          <DialogFooter className="bg-slate-50/80 backdrop-blur-sm p-8 pt-6 border-t">
            <Button variant="outline" onClick={() => setIsCreateCampaignOpen(false)} className="px-6">
              Annuleren
            </Button>
            <Button 
              onClick={() => createCampaign(campaignForm)}
              disabled={!campaignForm.name}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 shadow-lg"
            >
              <Target className="w-4 h-4 mr-2" />
              Campagne Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Details Dialog */}
      <Dialog open={isAccountDetailsOpen} onOpenChange={setIsAccountDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                  {selectedAccount?.company_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div>{selectedAccount?.company_name}</div>
                <div className="text-sm font-normal text-slate-600">{selectedAccount?.industry}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Users className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{selectedAccount?.company_size?.toLocaleString() || '—'}</div>
                <div className="text-sm text-slate-600">Employees</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Target className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{selectedAccount?.decision_maker_count || 0}</div>
                <div className="text-sm text-slate-600">Decision Makers</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <MapPin className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <div className="text-sm font-bold">
                  {[selectedAccount?.company_city, selectedAccount?.company_country].filter(Boolean).join(', ') || '—'}
                </div>
                <div className="text-sm text-slate-600">Location</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <div className="text-sm font-bold">
                  {selectedAccount?.last_communication_at 
                    ? new Date(selectedAccount.last_communication_at).toLocaleDateString()
                    : '—'
                  }
                </div>
                <div className="text-sm text-slate-600">Last Contact</div>
              </div>
            </div>
            
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">
                Detailed account insights and contact information will be displayed here.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccountDetailsOpen(false)}>
              Close
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add to Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}