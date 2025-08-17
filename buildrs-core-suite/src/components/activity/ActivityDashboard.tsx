import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuthenticatedClient } from '../../hooks/useAuthenticatedClient';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Activity,
  TrendingUp,
  Users,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Target,
  User,
  BarChart3,
  PieChart,
  RefreshCw,
  Download
} from 'lucide-react';
import { ActivityFeed } from './ActivityFeed';

export function ActivityDashboard() {
  const auth = useAuthenticatedClient();
  const [timeRange, setTimeRange] = useState('30');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Get activity statistics
  const activityStats = useQuery(
    api.activityLogger.getActivityStats,
    auth.clientId ? {
      clientId: auth.clientId,
      days: parseInt(timeRange),
    } : "skip"
  );

  if (auth.isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!auth.clientId) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please sign in to view activity dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contact': return <User className="h-4 w-4" />;
      case 'deal': return <DollarSign className="h-4 w-4" />;
      case 'campaign': return <Target className="h-4 w-4" />;
      case 'communication': return <MessageSquare className="h-4 w-4" />;
      case 'system': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('email')) return <Mail className="h-4 w-4" />;
    if (action.includes('linkedin')) return <MessageSquare className="h-4 w-4" />;
    if (action.includes('phone')) return <Phone className="h-4 w-4" />;
    if (action.includes('meeting')) return <Calendar className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Activity Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track all activities and engagement across your CRM
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {activityStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Activities</span>
              </div>
              <p className="text-2xl font-bold">{activityStats.totalActivities.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{activityStats.avgPerDay}/day average</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Communications</span>
              </div>
              <p className="text-2xl font-bold">
                {(activityStats.byCategory.communication || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {activityStats.totalActivities > 0 
                  ? Math.round(((activityStats.byCategory.communication || 0) / activityStats.totalActivities) * 100)
                  : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Deal Activities</span>
              </div>
              <p className="text-2xl font-bold">
                {(activityStats.byCategory.deal || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {activityStats.totalActivities > 0 
                  ? Math.round(((activityStats.byCategory.deal || 0) / activityStats.totalActivities) * 100)
                  : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Contact Activities</span>
              </div>
              <p className="text-2xl font-bold">
                {(activityStats.byCategory.contact || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {activityStats.totalActivities > 0 
                  ? Math.round(((activityStats.byCategory.contact || 0) / activityStats.totalActivities) * 100)
                  : 0}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feed">Activity Feed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="users">By User</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="deal">Deal</SelectItem>
                <SelectItem value="campaign">Campaign</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <ActivityFeed 
            limit={50} 
            category={selectedCategory === 'all' ? undefined : selectedCategory} 
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {activityStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activityStats.topActions.map((action, index) => (
                      <div key={action.action} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          {getActionIcon(action.action)}
                          <span className="text-sm font-medium capitalize">
                            {action.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <Badge variant="outline">{action.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Priority Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(activityStats.byPriority).map(([priority, count]) => (
                      <div key={priority} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={
                              priority === 'high' ? 'bg-red-100 text-red-800' :
                              priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              priority === 'low' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {priority}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {activityStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(activityStats.byCategory).map(([category, count]) => (
                <Card key={category}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <span className="font-medium capitalize">{category}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${activityStats.totalActivities > 0 ? (count / activityStats.totalActivities) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {activityStats.totalActivities > 0 
                          ? Math.round((count / activityStats.totalActivities) * 100)
                          : 0}% of total activities
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {activityStats && (
            <Card>
              <CardHeader>
                <CardTitle>Activity by User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(activityStats.byUser).map(([userId, count]) => (
                    <div key={userId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="font-medium">
                          {userId === 'system' ? 'System Generated' : `User ${userId}`}
                        </span>
                      </div>
                      <Badge variant="outline">{count} activities</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}