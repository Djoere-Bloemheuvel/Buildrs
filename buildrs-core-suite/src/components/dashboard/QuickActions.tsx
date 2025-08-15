
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, FileText, Calendar, Target, Zap, Brain } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const QuickActions = () => {
  const { theme } = useTheme();

  const cardClass = theme === 'premium-white'
    ? 'border border-gray-200 bg-white'
    : 'apple-card';

  const quickActions = [
    {
      title: 'Nieuw Contact',
      description: 'Voeg een nieuwe lead toe',
      icon: Users,
      color: 'blue',
      action: () => console.log('Add contact')
    },
    {
      title: 'Nieuwe Deal',
      description: 'Start een nieuwe deal',
      icon: Target,
      color: 'green',
      action: () => console.log('Add deal')
    },
    {
      title: 'Meeting Plannen',
      description: 'Plan een afspraak',
      icon: Calendar,
      color: 'purple',
      action: () => console.log('Schedule meeting')
    },
    {
      title: 'Offerte Maken',
      description: 'Nieuwe offerte',
      icon: FileText,
      color: 'orange',
      action: () => console.log('Create quote')
    },
    {
      title: 'AI Assistant',
      description: 'Start AI chat',
      icon: Brain,
      color: 'indigo',
      action: () => console.log('AI chat')
    },
    {
      title: 'Automatisering',
      description: 'Workflow setup',
      icon: Zap,
      color: 'yellow',
      action: () => console.log('Automation')
    }
  ];

  const getIconColor = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      indigo: 'text-indigo-600',
      yellow: 'text-yellow-600'
    };
    return colorMap[color as keyof typeof colorMap] || 'text-gray-600';
  };

  const getBgColor = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 hover:bg-blue-100',
      green: 'bg-green-50 hover:bg-green-100',
      purple: 'bg-purple-50 hover:bg-purple-100',
      orange: 'bg-orange-50 hover:bg-orange-100',
      indigo: 'bg-indigo-50 hover:bg-indigo-100',
      yellow: 'bg-yellow-50 hover:bg-yellow-100'
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-50 hover:bg-gray-100';
  };

  return (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className={theme === 'premium-white' ? 'text-gray-900' : 'text-foreground'}>
          Snelle Acties
        </CardTitle>
        <CardDescription className={theme === 'premium-white' ? 'text-gray-600' : 'text-muted-foreground'}>
          Veelgebruikte acties binnen handbereik
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`h-auto p-4 flex flex-col items-center gap-3 ${getBgColor(action.color)} transition-colors`}
              onClick={action.action}
            >
              <action.icon className={`w-6 h-6 ${getIconColor(action.color)}`} />
              <div className="text-center">
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
