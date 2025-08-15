import { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

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
import { useToast } from '@/hooks/use-toast';
import { useConvexAuth } from '@/hooks/useConvexAuth';
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

export default function LeadABM() {
  const { user } = useConvexAuth();
  // Mock profile data
  const profile = { client_id: 'client-1' };
  const { toast } = useToast();
  const qc = useQueryClient();

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

  // Fetch ABM candidates
  const { data: candidatesData, isLoading: candidatesLoading } = useQuery({
    queryKey: ['abm_candidates', search, page, pageSize, profile?.client_id],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('abm_candidates')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('company_name');

      if (search) {
        query = query.or(`company_name.ilike.%${search}%,industry.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      return { 
        accounts: (data as AbmCandidate[]) || [], 
        total: count ?? 0 
      };
    },
    enabled: !!profile?.client_id,
    staleTime: 60000,
  });

  // Fetch campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['abm_campaigns', profile?.client_id],
    queryFn: async () => {
      let query = supabase
        .from('campaigns')
        .select('*')
        .eq('channel', 'abm')
        .order('created_at', { ascending: false });

      if (profile?.client_id) {
        query = query.eq('client_id', profile.client_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data as Campaign[]) || [];
    },
    enabled: !!profile?.client_id,
    staleTime: 30000,
  });

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

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (formData: typeof campaignForm) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name: formData.name,
          description: formData.description,
          channel: 'abm',
          status: 'draft',
          proposition_id: formData.proposition_id || null,
          client_id: profile?.client_id,
          target_filter: formData.target_filter,
          stats: {
            sent: 0,
            opened: 0,
            clicked: 0,
            replied: 0,
            meetings_booked: 0,
            opportunities_created: 0,
            pipeline_value: 0,
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Campaign created successfully', description: 'Your ABM campaign has been created and is ready to launch.' });
      setIsCreateCampaignOpen(false);
      setCampaignForm({
        name: '',
        description: '',
        proposition_id: '',
        target_filter: { industry: '', company_size_min: '', company_size_max: '', country: '' },
      });
      qc.invalidateQueries({ queryKey: ['abm_campaigns'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create campaign', 
        description: error.message || 'Something went wrong.', 
        variant: 'destructive' 
      });
    },
  });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Modern Header */}
      <div className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="px-8 py-6">
      <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                Account-Based Marketing
              </h1>
              <p className="text-slate-600 mt-1 font-medium">
                Target high-value accounts with personalized campaigns
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search accounts, campaigns..."
                  className="pl-10 w-80 h-11 bg-white/60 border-slate-200 focus:bg-white"
                />
              </div>
              <Button 
                onClick={() => setIsCreateCampaignOpen(true)}
                className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="px-8">
            <TabsList className="h-12 bg-slate-100 p-1">
              <TabsTrigger value="dashboard" className="h-10 px-6">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="h-10 px-6">
                <Target className="w-4 h-4 mr-2" />
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="accounts" className="h-10 px-6">
                <Building2 className="w-4 h-4 mr-2" />
                Target Accounts
              </TabsTrigger>
              <TabsTrigger value="analytics" className="h-10 px-6">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      <div className="px-8 py-8">
        <Tabs value={selectedTab} className="w-full">
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-blue-100">Active Campaigns</CardTitle>
                    <Activity className="w-5 h-5 text-blue-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{campaignStats?.active || 0}</div>
                  <p className="text-blue-200 text-sm">of {campaignStats?.total || 0} total</p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-emerald-100">Messages Sent</CardTitle>
                    <Mail className="w-5 h-5 text-emerald-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{campaignStats?.totalSent || 0}</div>
                  <p className="text-emerald-200 text-sm">across all campaigns</p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-orange-100">Reply Rate</CardTitle>
                    <TrendingUp className="w-5 h-5 text-orange-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{campaignStats?.replyRate || 0}%</div>
                  <p className="text-orange-200 text-sm">average response rate</p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-purple-100">Pipeline Value</CardTitle>
                    <Zap className="w-5 h-5 text-purple-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(campaignStats?.totalPipelineValue || 0)}</div>
                  <p className="text-purple-200 text-sm">generated revenue</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Campaigns */}
            <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Recent Campaigns</CardTitle>
                    <CardDescription>Latest account-based marketing activities</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedTab('campaigns')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                        </div>
                        <div className="w-20 h-6 bg-slate-200 rounded"></div>
                      </div>
                    ))
                  ) : campaigns?.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-semibold">
                            {campaign.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-slate-900">{campaign.name}</div>
                          <div className="text-sm text-slate-600">
                            {campaign.stats.sent} sent • {campaign.stats.replied} replies
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`${getStatusColor(campaign.status)} border`}>
                          {campaign.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Campaign Management</h2>
                <p className="text-slate-600">Create, monitor, and optimize your ABM campaigns</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {campaignsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border-0 shadow-lg animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-3 bg-slate-200 rounded"></div>
                        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : campaigns?.map((campaign) => (
                <Card key={campaign.id} className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm">
                            {campaign.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          <CardDescription>{new Date(campaign.created_at).toLocaleDateString()}</CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className={`${getStatusColor(campaign.status)} border`}>
                          {campaign.status}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          {campaign.status === 'active' ? (
                            <Button variant="outline" size="sm">
                              <PauseCircle className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm">
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-slate-500">Sent</div>
                          <div className="font-semibold text-slate-900">{campaign.stats.sent || 0}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Opened</div>
                          <div className="font-semibold text-slate-900">{campaign.stats.opened || 0}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Replied</div>
                          <div className="font-semibold text-slate-900">{campaign.stats.replied || 0}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Pipeline</div>
                          <div className="font-semibold text-slate-900">{formatCurrency(campaign.stats.pipeline_value || 0)}</div>
                        </div>
                      </div>
                      
                      {campaign.stats.sent > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Reply Rate</span>
                            <span className="font-medium">{((campaign.stats.replied / campaign.stats.sent) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all" 
                              style={{ width: `${(campaign.stats.replied / campaign.stats.sent) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Target Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Target Accounts</h2>
                <p className="text-slate-600">High-value accounts eligible for ABM campaigns</p>
              </div>
              <div className="flex items-center gap-3">
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
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
              ) : candidatesData?.accounts.map((account) => (
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
                          Company Size
                        </div>
                        <Badge variant="secondary">
                          {account.company_size ? `${account.company_size.toLocaleString()}` : 'Unknown'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-slate-600">
                          <MapPin className="w-4 h-4 mr-1" />
                          Location
                        </div>
                        <span className="text-slate-900 font-medium">
                          {[account.company_city, account.company_country].filter(Boolean).join(', ') || 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-slate-600">
                          <Target className="w-4 h-4 mr-1" />
                          Decision Makers
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
                          Add to Campaign
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
        </Tabs>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New ABM Campaign</DialogTitle>
            <DialogDescription>
              Set up a new account-based marketing campaign to target high-value accounts
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter campaign name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-description">Description</Label>
              <Textarea
                id="campaign-description"
                value={campaignForm.description}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your campaign goals and strategy"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Proposition</Label>
              <PropositionSelect 
                value={campaignForm.proposition_id || undefined}
                onChange={(id) => setCampaignForm(prev => ({ ...prev, proposition_id: id || '' }))}
              />
            </div>

            <div className="space-y-4">
              <Label>Target Account Filters</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={campaignForm.target_filter.industry}
                    onChange={(e) => setCampaignForm(prev => ({
                      ...prev,
                      target_filter: { ...prev.target_filter, industry: e.target.value }
                    }))}
                    placeholder="e.g. Technology"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={campaignForm.target_filter.country}
                    onChange={(e) => setCampaignForm(prev => ({
                      ...prev,
                      target_filter: { ...prev.target_filter, country: e.target.value }
                    }))}
                    placeholder="e.g. Netherlands"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size-min">Min Company Size</Label>
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
                  <Label htmlFor="size-max">Max Company Size</Label>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateCampaignOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createCampaignMutation.mutate(campaignForm)}
              disabled={!campaignForm.name || createCampaignMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
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
    </div>
  );
}