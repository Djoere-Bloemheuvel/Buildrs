import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthenticatedClient } from '../hooks/useAuthenticatedClient';
import { CommunicationsOverview } from '../components/communications/CommunicationsOverview';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Calendar,
  Filter,
  Search,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function Communications() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  // SECURE: Get authenticated client context
  const auth = useAuthenticatedClient();
  const createUserClient = useMutation(api.clients.createUserClient);

  // Handle client creation if needed
  const handleCreateClient = async () => {
    if (!auth.userId) return;
    
    try {
      await createUserClient({
        userId: auth.userId,
        companyName: "My Company",
      });
    } catch (error) {
      console.error('Failed to create client:', error);
    }
  };

  // Show loading state
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
      </div>
    );
  }

  // Show authentication error
  if (auth.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">{auth.error}</p>
            <Button onClick={() => window.location.href = '/sign-in'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle client creation if no client exists
  if (!auth.clientId && auth.userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Setup Required</h2>
            <p className="text-muted-foreground mb-4">
              Let's set up your communication monitoring workspace.
            </p>
            <Button onClick={handleCreateClient}>
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch communications data with authenticated client ID
  const communications = useQuery(api.communications.getClientCommunications, 
    auth.clientId ? {
      clientId: auth.clientId,
      limit: 100,
    } : "skip"
  );

  const communicationStats = useQuery(api.communications.getClientCommunicationStats,
    auth.clientId ? {
      clientId: auth.clientId,
      days: parseInt(dateRange),
    } : "skip"
  );

  // Filter communications based on search and filters
  const filteredCommunications = communications?.filter(comm => {
    if (filterType !== 'all' && comm.type !== filterType) return false;
    if (filterStatus !== 'all' && comm.status !== filterStatus) return false;
    if (searchQuery && !comm.subject?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !comm.content?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !comm.fromEmail?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !comm.toEmail?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'linkedin': return <MessageSquare className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': case 'answered': case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': case 'missed': return 'bg-red-100 text-red-800';
      case 'pending': case 'sending': return 'bg-yellow-100 text-yellow-800';
      case 'opened': return 'bg-blue-100 text-blue-800';
      case 'clicked': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'inbound' ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-gray-50 border-l-4 border-l-gray-500';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communications</h1>
          <p className="text-muted-foreground">
            Monitor and manage all customer communications across email, LinkedIn, and phone
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {communicationStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Communications</span>
              </div>
              <p className="text-2xl font-bold">{communicationStats.totalCommunications}</p>
              <p className="text-xs text-muted-foreground">
                {communicationStats.avgPerDay}/day average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Emails</span>
              </div>
              <p className="text-2xl font-bold">{communicationStats.emailCount}</p>
              <p className="text-xs text-muted-foreground">
                {Math.round((communicationStats.emailCount / communicationStats.totalCommunications) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">LinkedIn</span>
              </div>
              <p className="text-2xl font-bold">{communicationStats.linkedinCount}</p>
              <p className="text-xs text-muted-foreground">
                {Math.round((communicationStats.linkedinCount / communicationStats.totalCommunications) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Phone Calls</span>
              </div>
              <p className="text-2xl font-bold">{communicationStats.phoneCount}</p>
              <p className="text-xs text-muted-foreground">
                {Math.round((communicationStats.phoneCount / communicationStats.totalCommunications) * 100)}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Setup & Overview</TabsTrigger>
          <TabsTrigger value="communications">Communications Log</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {auth.clientId && <CommunicationsOverview clientId={auth.clientId} />}
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Communications Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search communications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="opened">Opened</SelectItem>
                    <SelectItem value="clicked">Clicked</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Communications List */}
              <div className="space-y-3">
                {!filteredCommunications ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading communications...</p>
                  </div>
                ) : filteredCommunications.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">No communications found</p>
                    <p className="text-muted-foreground">Try adjusting your filters or search query</p>
                  </div>
                ) : (
                  filteredCommunications.map((comm) => (
                    <Card key={comm._id} className={`${getDirectionColor(comm.direction)} hover:shadow-md transition-shadow`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center gap-2 mt-1">
                              {getTypeIcon(comm.type)}
                              <Badge variant="outline" className={getStatusColor(comm.status)}>
                                {comm.status}
                              </Badge>
                              <Badge variant="outline">
                                {comm.direction}
                              </Badge>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {comm.subject && (
                                  <h4 className="font-medium truncate">{comm.subject}</h4>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {comm.provider}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-muted-foreground mb-2">
                                {comm.type === 'email' && (
                                  <span>
                                    {comm.direction === 'inbound' ? 'From' : 'To'}: {' '}
                                    {comm.direction === 'inbound' ? comm.fromEmail : comm.toEmail}
                                  </span>
                                )}
                                {comm.type === 'linkedin' && comm.linkedinUrl && (
                                  <span>LinkedIn: {comm.linkedinUrl}</span>
                                )}
                                {comm.type === 'phone' && comm.metadata?.phoneNumber && (
                                  <span>Phone: {comm.metadata.phoneNumber}</span>
                                )}
                              </div>
                              
                              {comm.content && (
                                <p className="text-sm line-clamp-2">{comm.content}</p>
                              )}

                              {/* Metadata indicators */}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {comm.metadata?.duration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {comm.metadata.duration}s
                                  </span>
                                )}
                                {comm.metadata?.openedAt && (
                                  <span className="text-blue-600">Opened</span>
                                )}
                                {comm.metadata?.clickedAt && (
                                  <span className="text-purple-600">Clicked</span>
                                )}
                                {comm.metadata?.repliedAt && (
                                  <span className="text-green-600">Replied</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right text-sm text-muted-foreground">
                            <p>{format(comm.timestamp, 'MMM d, yyyy')}</p>
                            <p>{formatDistanceToNow(comm.timestamp)} ago</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Communication Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Detailed insights into your communication performance
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Response Rates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Response Rates</h3>
                  {communicationStats && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Email Response Rate</span>
                        <span className="font-medium">
                          {communicationStats.emailResponseRate}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">LinkedIn Response Rate</span>
                        <span className="font-medium">
                          {communicationStats.linkedinResponseRate}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Phone Success Rate</span>
                        <span className="font-medium">
                          {communicationStats.phoneSuccessRate}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Engagement */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contact Engagement</h3>
                  {communicationStats && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Unique Contacts Reached</span>
                        <span className="font-medium">
                          {communicationStats.uniqueContactsReached}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Avg Communications per Contact</span>
                        <span className="font-medium">
                          {communicationStats.avgPerContact}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Most Active Channel</span>
                        <span className="font-medium">
                          {communicationStats.mostActiveChannel}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}