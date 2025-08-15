import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CallButtonProps {
  contact: {
    first_name: string;
    last_name: string;
    mobile_phone?: string | null;
  };
}

export function CallButton({ contact }: CallButtonProps) {
  const { toast } = useToast();

  const handleCall = () => {
    if (contact.mobile_phone) {
      toast({
        title: 'Oproep gestart',
        description: `Bellen met ${contact.first_name} ${contact.last_name}...`,
      });
      
      if (window.navigator.userAgent.includes('Mobile')) {
        window.location.href = `tel:${contact.mobile_phone}`;
      }
    } else {
      toast({
        title: 'Geen telefoonnummer',
        description: 'Voor deze contactpersoon is geen telefoonnummer beschikbaar.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCall} className="gap-2">
      <Phone className="h-4 w-4" />
      Bellen
    </Button>
  );
}
