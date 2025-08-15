
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from '@/contexts/ThemeContext';

export const RecentSales = () => {
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

  const sales = [
    {
      name: "Oliver Hansen",
      email: "oliver.hansen@email.com",
      amount: "+€1,999.00",
      avatar: "/placeholder.svg"
    },
    {
      name: "Jackson Lee",
      email: "jackson.lee@email.com", 
      amount: "+€39.00",
      avatar: "/placeholder.svg"
    },
    {
      name: "Isabella Nguyen",
      email: "isabella.nguyen@email.com",
      amount: "+€299.00",
      avatar: "/placeholder.svg"
    },
    {
      name: "William Kim",
      email: "will@email.com",
      amount: "+€99.00",
      avatar: "/placeholder.svg"
    },
    {
      name: "Sofia Davis",
      email: "sofia.davis@email.com",
      amount: "+€39.00",
      avatar: "/placeholder.svg"
    }
  ];

  return (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className={textClass}>Recente Verkopen</CardTitle>
        <CardDescription className={mutedClass}>
          Je hebt 265 verkopen deze maand.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {sales.map((sale, index) => (
            <div key={index} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={sale.avatar} alt="Avatar" />
                <AvatarFallback>{sale.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className={`text-sm font-medium leading-none ${textClass}`}>
                  {sale.name}
                </p>
                <p className={`text-sm ${mutedClass}`}>
                  {sale.email}
                </p>
              </div>
              <div className={`ml-auto font-medium ${textClass}`}>
                {sale.amount}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
