
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const BottomCards = () => {
  const { theme } = useTheme();

  const cardClass = theme === 'premium-white'
    ? 'border border-gray-200 bg-white'
    : 'apple-card';

  const textClass = theme === 'premium-white' 
    ? 'text-gray-900' 
    : 'text-foreground';

  const mutedClass = theme === 'premium-white'
    ? 'text-gray-600'
    : 'text-muted-foreground';

  return (
    <div className="space-y-6">
      {/* Upcoming Meetings */}
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${textClass}`}>
            <Calendar className="w-5 h-5" />
            Komende Meetings
          </CardTitle>
          <CardDescription className={mutedClass}>
            Jouw agenda voor vandaag
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div>
              <p className="font-medium text-blue-900">Sales Call - TechCorp</p>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Clock className="w-4 h-4" />
                14:00 - 15:00
              </div>
            </div>
            <Badge variant="secondary">Vandaag</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
            <div>
              <p className="font-medium text-green-900">Project Review</p>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Clock className="w-4 h-4" />
                16:30 - 17:30
              </div>
            </div>
            <Badge variant="secondary">Vandaag</Badge>
          </div>
          
          <Button variant="outline" className="w-full">
            Alle meetings bekijken
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${textClass}`}>
            <Users className="w-5 h-5" />
            Team Performance
          </CardTitle>
          <CardDescription className={mutedClass}>
            Deze maand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sarah Johnson</p>
              <p className="text-sm text-muted-foreground">Sales Manager</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">€45,000</p>
              <p className="text-sm text-muted-foreground">120% target</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mike Chen</p>
              <p className="text-sm text-muted-foreground">Account Manager</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-600">€38,000</p>
              <p className="text-sm text-muted-foreground">95% target</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Lisa Rodriguez</p>
              <p className="text-sm text-muted-foreground">Business Developer</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-purple-600">€52,000</p>
              <p className="text-sm text-muted-foreground">130% target</p>
            </div>
          </div>
          
          <Button variant="outline" className="w-full">
            Team overzicht
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
