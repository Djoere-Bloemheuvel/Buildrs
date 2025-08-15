
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, CalendarRange, Inbox, Timer, Sparkles, type LucideIcon } from 'lucide-react';

const icons: Record<string, LucideIcon> = { ListChecks, CalendarRange, Inbox, Timer, Sparkles };

export function CardSection({ title, icon, children }: { title: string; icon: keyof typeof icons; children: React.ReactNode }) {
  const Icon = icons[icon] ?? ListChecks;
  return (
    <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <CardTitle>
          <h2 className="text-base font-semibold">{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">{children}</CardContent>
    </Card>
  );
}
