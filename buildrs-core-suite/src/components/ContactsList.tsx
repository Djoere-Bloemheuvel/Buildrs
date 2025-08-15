
import { useQuery } from '@tanstack/react-query';
import { fetchContacts } from '@/data/crm';
import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  Building2,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ContactsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: contacts, isLoading, error } = useQuery({
    queryKey: ['contacts', searchTerm, statusFilter],
    queryFn: () => fetchContacts(searchTerm, statusFilter),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'warm': return 'bg-warning/20 text-warning border-warning/30';
      case 'cold': return 'bg-primary/20 text-primary border-primary/30';
      case 'qualified': return 'bg-success/20 text-success border-success/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'hot': return 'Heet';
      case 'warm': return 'Warm';
      case 'cold': return 'Koud';
      case 'qualified': return 'Gekwalificeerd';
      default: return status;
    }
  };

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-destructive">Fout bij laden van contacten: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="glass-surface p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-poppins font-bold text-gradient-primary">
              Contacten
            </h1>
            <p className="text-muted-foreground">
              Beheer en monitor uw contactennetwerk
            </p>
          </div>
          <Button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nieuw Contact
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-surface p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek contacten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-glass/50 border-glass-border"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Alle
            </Button>
            <Button
              variant={statusFilter === 'hot' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('hot')}
            >
              Heet
            </Button>
            <Button
              variant={statusFilter === 'warm' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('warm')}
            >
              Warm
            </Button>
            <Button
              variant={statusFilter === 'qualified' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('qualified')}
            >
              Gekwalificeerd
            </Button>
          </div>
        </div>
      </div>

      {/* Contacts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-surface p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-glass rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-glass rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-glass rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-glass rounded w-full"></div>
                <div className="h-3 bg-glass rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {contacts?.map((contact) => (
            <div key={contact.id} className="glass-surface-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {contact.first_name?.[0]}{contact.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {contact.first_name} {contact.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {contact.job_title}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="glass-surface">
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      Bekijken
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Bewerken
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Verwijderen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{contact.email || 'Geen email'}</span>
                </div>
                {contact.mobile_phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{contact.mobile_phone}</span>
                  </div>
                )}
                {contact.companies && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{contact.companies.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-md text-xs border ${getStatusColor(contact.status)}`}>
                  {getStatusLabel(contact.status)}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Calendar className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {contacts && contacts.length === 0 && (
        <div className="glass-surface p-12 text-center">
          <div className="w-16 h-16 bg-glass rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Geen contacten gevonden</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm 
              ? `Geen contacten gevonden voor "${searchTerm}"`
              : 'Begin met het toevoegen van uw eerste contact'
            }
          </p>
          <Button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nieuw Contact
          </Button>
        </div>
      )}
    </div>
  );
};
