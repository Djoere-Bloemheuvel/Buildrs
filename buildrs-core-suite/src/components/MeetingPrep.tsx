
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { 
  Brain, 
  Search, 
  Calendar, 
  Building2, 
  User,
  MessageSquare,
  FileText,
  Clock,
  Star,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const MeetingPrep = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: meetingPreps, isLoading } = useQuery({
    queryKey: ['meeting-prep', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('meeting_prep')
        .select('*')
        .order('contact_id');

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(12);
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-8 animate-pulse">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-glass/50 rounded-full"></div>
              <div className="flex-1">
                <div className="h-6 bg-glass/50 rounded-2xl mb-3 w-1/3"></div>
                <div className="h-4 bg-glass/30 rounded-xl w-1/4"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="h-40 bg-glass/30 rounded-2xl"></div>
              <div className="h-40 bg-glass/30 rounded-2xl"></div>
              <div className="h-40 bg-glass/30 rounded-2xl"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="glass-card p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-poppins font-bold text-gradient-primary flex items-center gap-4 mb-2">
              <div className="icon-primary floating">
                <Brain className="w-6 h-6 text-white" />
              </div>
              Meeting Prep AI
            </h1>
            <p className="text-muted-foreground text-lg">
              AI-powered voorbereiding voor uw sales gesprekken
            </p>
          </div>
          <Button className="btn-primary group">
            <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            Nieuwe Prep Genereren
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Zoek contacten of bedrijven voor meeting prep..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 bg-glass/30 border-glass-border/50 rounded-2xl text-lg focus:bg-glass/50 focus:border-primary/50 transition-all duration-300"
          />
        </div>
      </div>

      {/* Meeting Prep Cards */}
      <div className="space-y-8">
        {meetingPreps?.map((prep) => (
          <div key={prep.contact_id} className="glass-card-hover p-8">
            {/* Contact Header */}
            <div className="flex items-center gap-6 mb-10">
              <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary to-secondary rounded-full flex items-center justify-center shadow-xl">
                <span className="text-white font-bold text-xl">
                  {prep.first_name?.[0]}{prep.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-poppins font-bold text-foreground mb-1">
                  {prep.first_name} {prep.last_name}
                </h2>
                <p className="text-muted-foreground text-lg">
                  {prep.job_title} bij {prep.company_name}
                </p>
              </div>
              <Button className="btn-primary group">
                <Calendar className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Plan Meeting
              </Button>
            </div>

            {/* Prep Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Company Insights */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="icon-secondary floating">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-poppins font-semibold text-lg">Bedrijf Inzichten</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Industrie</p>
                    <p className="text-foreground font-medium">{prep.industry || 'Onbekend'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Bedrijfsomvang</p>
                    <p className="text-foreground font-medium">
                      {prep.company_size ? `${prep.company_size} werknemers` : 'Onbekend'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Locatie</p>
                    <p className="text-foreground font-medium">{prep.location || 'Onbekend'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="icon-green floating-delayed">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-poppins font-semibold text-lg">Contact Details</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Functiegroep</p>
                    <p className="text-foreground font-medium">{prep.function_group || 'Onbekend'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Senioriteit</p>
                    <p className="text-foreground font-medium">{prep.seniority || 'Onbekend'}</p>
                  </div>
                  {prep.linkedin_url && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2 font-medium">LinkedIn</p>
                      <a 
                        href={prep.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-secondary transition-colors duration-300 font-medium underline decoration-primary/30 hover:decoration-secondary/50"
                      >
                        Bekijk profiel
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Insights */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="icon-orange floating">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-poppins font-semibold text-lg">AI Inzichten</h3>
                </div>
                <div className="space-y-4">
                  {prep.company_summary && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2 font-medium">Samenvatting</p>
                      <p className="text-foreground font-medium line-clamp-3 leading-relaxed">{prep.company_summary}</p>
                    </div>
                  )}
                  {prep.company_keywords && prep.company_keywords.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3 font-medium">Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {prep.company_keywords.slice(0, 3).map((keyword: string, index: number) => (
                          <span key={index} className="px-3 py-2 bg-primary/20 border border-primary/30 text-primary text-sm rounded-xl font-medium hover:bg-primary/30 transition-colors duration-300">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Insights */}
            {(prep.company_common_problems || prep.company_target_customers) && (
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {prep.company_common_problems && (
                  <div className="glass-card p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="icon-primary">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-poppins font-semibold text-lg">Veelvoorkomende Problemen</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{prep.company_common_problems}</p>
                  </div>
                )}

                {prep.company_target_customers && (
                  <div className="glass-card p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="icon-secondary">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-poppins font-semibold text-lg">Doelgroep</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{prep.company_target_customers}</p>
                  </div>
                )}
              </div>
            )}

            {/* Recent Communications */}
            {prep.recent_communications && (
              <div className="mt-8">
                <div className="glass-card p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="icon-green">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-poppins font-semibold text-lg">Recente Communicatie</h3>
                  </div>
                  <div className="text-muted-foreground">
                    Laatste interacties en gesprekspunten beschikbaar
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Button className="btn-primary group">
                <Brain className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Genereer Gesprekspunten
              </Button>
              <Button className="btn-secondary group">
                <FileText className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Export naar PDF
              </Button>
              <Button className="btn-secondary group">
                <MessageSquare className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Stuur Reminder
              </Button>
            </div>
          </div>
        ))}
      </div>

      {meetingPreps && meetingPreps.length === 0 && (
        <div className="glass-card p-16 text-center">
          <div className="icon-primary mx-auto mb-6 floating w-20 h-20">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-poppins font-semibold mb-4">Geen meeting prep data</h3>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto leading-relaxed">
            {searchTerm 
              ? `Geen meeting prep gevonden voor "${searchTerm}"`
              : 'Begin met het selecteren van contacten voor AI-powered meeting voorbereiding'
            }
          </p>
          <Button className="btn-primary group">
            <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            Genereer Meeting Prep
          </Button>
        </div>
      )}
    </div>
  );
};
