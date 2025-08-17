import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuthenticatedClient } from '../../hooks/useAuthenticatedClient';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  User,
  DollarSign,
  Target,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  contactId?: string;
  limit?: number;
  category?: string;
  showAll?: boolean;
}

export function ActivityFeed({ contactId, limit = 20, category, showAll = false }: ActivityFeedProps) {
  const auth = useAuthenticatedClient();
  
  // Fetch activities based on whether we're showing contact-specific or all client activities
  const activities = useQuery(
    contactId ? api.activityLogger.getContactActivities : api.activityLogger.getClientActivities,
    auth.clientId ? {
      clientId: auth.clientId,
      ...(contactId && { contactId }),
      limit,
      category,
    } : "skip"
  );

  const getActivityIcon = (action: string) => {
    if (action.includes('email')) return <Mail className="h-4 w-4" />;
    if (action.includes('linkedin')) return <MessageSquare className="h-4 w-4" />;
    if (action.includes('phone')) return <Phone className="h-4 w-4" />;
    if (action.includes('meeting')) return <Calendar className="h-4 w-4" />;
    if (action.includes('contact')) return <User className="h-4 w-4" />;
    if (action.includes('deal')) return <DollarSign className="h-4 w-4" />;
    if (action.includes('campaign')) return <Target className="h-4 w-4" />;
    if (action.includes('settings')) return <Settings className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'critical': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('created') || action.includes('won')) return 'text-green-600';
    if (action.includes('lost') || action.includes('failed')) return 'text-red-600';
    if (action.includes('updated') || action.includes('changed')) return 'text-blue-600';
    if (action.includes('sent') || action.includes('opened')) return 'text-purple-600';
    return 'text-gray-600';
  };

  if (auth.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
            <span className="text-sm text-gray-500">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No activities found</p>
            <p className="text-sm text-gray-400 mt-1">
              {contactId ? "Activities for this contact will appear here" : "Your team's activities will appear here"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Feed
          <Badge variant="outline" className="ml-auto">
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {activities.map((activity: any, index: number) => {
            const isSystemGenerated = activity.isSystemGenerated;
            const isLastItem = index === activities.length - 1;
            
            return (
              <div 
                key={activity._id} 
                className={`flex items-start gap-4 p-4 ${!isLastItem ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}
              >
                {/* Avatar/Icon */}
                <div className="flex-shrink-0">
                  {isSystemGenerated ? (
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                  ) : (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {activity.userName ? activity.userName.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      
                      {/* Related entity info */}
                      {activity.relatedEntity && (
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.relatedEntity.type === 'contact' && (
                            <>👤 {activity.relatedEntity.name} • {activity.relatedEntity.email}</>
                          )}
                          {activity.relatedEntity.type === 'deal' && (
                            <>💰 {activity.relatedEntity.name} • €{activity.relatedEntity.value?.toLocaleString()}</>
                          )}
                          {activity.relatedEntity.type === 'campaign' && (
                            <>🎯 {activity.relatedEntity.name}</>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Activity Icon */}
                      <div className={`${getActionColor(activity.action)}`}>
                        {getActivityIcon(activity.action)}
                      </div>
                      
                      {/* Priority Badge */}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(activity.priority)}`}
                      >
                        {activity.priority}
                      </Badge>
                    </div>
                  </div>

                  {/* Timestamp and category */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                    
                    <span className="text-xs text-gray-300">•</span>
                    
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      {activity.category}
                    </Badge>
                    
                    {isSystemGenerated && (
                      <>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-blue-600 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Auto
                        </span>
                      </>
                    )}
                  </div>

                  {/* Metadata preview voor belangrijke details */}
                  {activity.metadata && (
                    <div className="mt-2">
                      {activity.action.includes('deal_value_changed') && activity.metadata.oldValue !== undefined && (
                        <p className="text-xs text-gray-600">
                          Value: €{activity.metadata.oldValue?.toLocaleString() || 0} → €{activity.metadata.newValue?.toLocaleString() || 0}
                        </p>
                      )}
                      
                      {activity.action.includes('status_changed') && activity.metadata.oldStatus && (
                        <p className="text-xs text-gray-600">
                          Status: {activity.metadata.oldStatus} → {activity.metadata.newStatus}
                        </p>
                      )}
                      
                      {activity.action.includes('email') && activity.metadata.fromEmail && (
                        <p className="text-xs text-gray-600">
                          {activity.metadata.fromEmail} → {activity.metadata.toEmail}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Load more indicator if there might be more */}
        {activities.length >= limit && (
          <div className="p-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Showing last {limit} activities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for dashboards
export function ActivityFeedCompact({ contactId, limit = 5 }: { contactId?: string; limit?: number }) {
  return <ActivityFeed contactId={contactId} limit={limit} showAll={false} />;
}

// Full version for dedicated activity pages
export function ActivityFeedFull({ contactId, category }: { contactId?: string; category?: string }) {
  return <ActivityFeed contactId={contactId} limit={50} category={category} showAll={true} />;
}