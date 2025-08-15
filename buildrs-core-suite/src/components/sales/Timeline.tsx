import { format } from 'date-fns';
import { Mail, Phone, Linkedin, Calendar, MessageSquare, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Communication {
  id: string;
  created_at: string;
  channel: string;
  type: string;
  direction: string;
  content: string;
  sentiment?: string | null;
}

interface TimelineProps {
  communications: Communication[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

export function Timeline({ communications, isLoading, onLoadMore, hasMore }: TimelineProps) {
  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction.toLowerCase()) {
      case 'inbound':
        return 'text-green-600';
      case 'outbound':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSentimentBadge = (sentiment?: string | null) => {
    if (!sentiment) return null;
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return <Badge variant="outline" className="text-green-600 border-green-200">Positive</Badge>;
      case 'negative':
        return <Badge variant="outline" className="text-red-600 border-red-200">Negative</Badge>;
      case 'neutral':
        return <Badge variant="outline" className="text-gray-600 border-gray-200">Neutral</Badge>;
      default:
        return null;
    }
  };

  const grouped = communications.reduce((acc, c) => {
    const key = format(new Date(c.created_at), 'yyyy-MM-dd');
    (acc[key] ||= []).push(c);
    return acc;
  }, {} as Record<string, Communication[]>);

  if (isLoading && communications.length === 0) {
    return <TimelineSkeleton />;
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          360° Tijdlijn
        </CardTitle>
      </CardHeader>
      <CardContent>
        {communications.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nog geen activiteiten</h3>
            <p className="text-muted-foreground mb-4">Begin met contact om de activiteiten-tijdlijn te vullen.</p>
            <Button variant="outline" size="sm" disabled>
              Notitie toevoegen
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <div className="h-px bg-border flex-1" />
                  <span className="px-2">{format(new Date(date), 'MMMM d, yyyy')}</span>
                  <div className="h-px bg-border flex-1" />
                </div>

                {items.map((comm) => (
                  <div key={comm.id} className="flex gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                    <div className={`p-2 rounded-full ${getDirectionColor(comm.direction)} bg-muted/50`}>
                      {getChannelIcon(comm.channel)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{comm.channel}</span>
                          <Badge variant="outline" className="text-xs">{comm.type}</Badge>
                          <span className={`text-xs ${getDirectionColor(comm.direction)}`}>{comm.direction}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSentimentBadge(comm.sentiment)}
                          <span className="text-xs text-muted-foreground">{format(new Date(comm.created_at), 'HH:mm')}</span>
                        </div>
                      </div>
                      {comm.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {comm.content.length > 150 ? `${comm.content.substring(0, 150)}...` : comm.content}
                        </p>
                      )}
                    </div>
                  </div>)
                )}
              </div>
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={onLoadMore} disabled={isLoading} className="w-full">
                  {isLoading ? 'Laden…' : 'Meer laden'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineSkeleton() {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
