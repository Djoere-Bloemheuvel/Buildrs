
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const TopCards = () => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${textClass}`}>
            Totale Omzet
          </CardTitle>
          <DollarSign className={`h-4 w-4 ${mutedClass}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${textClass}`}>€45,231.89</div>
          <p className={`text-xs ${mutedClass}`}>
            +20.1% van vorige maand
          </p>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${textClass}`}>
            Nieuwe Klanten
          </CardTitle>
          <Users className={`h-4 w-4 ${mutedClass}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${textClass}`}>+2350</div>
          <p className={`text-xs ${mutedClass}`}>
            +180.1% van vorige maand
          </p>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${textClass}`}>
            Actieve Deals
          </CardTitle>
          <Target className={`h-4 w-4 ${mutedClass}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${textClass}`}>+12,234</div>
          <p className={`text-xs ${mutedClass}`}>
            +19% van vorige maand
          </p>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${textClass}`}>
            Conversie Rate
          </CardTitle>
          <TrendingUp className={`h-4 w-4 ${mutedClass}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${textClass}`}>23.5%</div>
          <p className={`text-xs ${mutedClass}`}>
            +7% van vorige maand
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
