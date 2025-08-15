
import { Mail, FileText, Calendar, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BackButton } from './BackButton';
import { CallButton } from './CallButton';

interface ContactHeaderProps {
  contact: {
    first_name: string;
    last_name: string;
    job_title?: string;
    email?: string;
    mobile_phone?: string | null;
    function_group?: string | null;
    companies?: { name?: string };
  };
  onMeetingPrep: () => void;
}

export function ContactHeader({ contact, onMeetingPrep }: ContactHeaderProps) {
  const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();

  const mapFunctionGroup = (group?: string | null) => {
    if (!group) return null;
    const mappings: Record<string, string> = {
      owner: 'Owner/Founder',
      founder: 'Owner/Founder',
      marketing: 'Marketing Decision Maker',
      sales: 'Sales Decision Maker',
      operations: 'Operational Decision Maker',
      hr: 'HR Decision Maker',
      finance: 'Finance Decision Maker',
      it: 'IT Decision Maker',
    };
    return mappings[group.toLowerCase()] || group;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <BackButton />

        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary/10 text-primary">
            {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')}
          </AvatarFallback>
        </Avatar>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{fullName}</h1>
            {contact.function_group && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {mapFunctionGroup(contact.function_group)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {contact.job_title && <span>{contact.job_title}</span>}
            {contact.job_title && contact.companies?.name && <span>•</span>}
            {contact.companies?.name && <span>{contact.companies.name}</span>}
            {contact.mobile_phone && <span>•</span>}
            {contact.mobile_phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {contact.mobile_phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CallButton contact={{ first_name: contact.first_name, last_name: contact.last_name, mobile_phone: contact.mobile_phone }} />

        {contact.email && (
          <Button variant="outline" size="sm" asChild>
            <a href={`mailto:${contact.email}`} className="gap-2">
              <Mail className="h-4 w-4" />
              E-mail
            </a>
          </Button>
        )}

        <Button variant="outline" size="sm" disabled className="gap-2">
          <FileText className="h-4 w-4" />
          Nieuwe offerte
        </Button>

        <Button variant="default" size="sm" onClick={onMeetingPrep} className="gap-2">
          <Calendar className="h-4 w-4" />
          Meeting voorbereiden
        </Button>
      </div>
    </div>
  );
}
