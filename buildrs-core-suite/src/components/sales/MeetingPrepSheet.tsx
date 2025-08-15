import { useState } from 'react';
import { X, Calendar, User, Building2, FileText, Lightbulb } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MeetingPrepSheetProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    first_name: string;
    last_name: string;
    job_title?: string;
    function_group?: string;
    companies?: {
      name?: string;
      industry_label?: string;
      company_size?: number;
      company_summary?: string;
      company_keywords?: string[];
    };
  };
}

export function MeetingPrepSheet({ isOpen, onClose, contact }: MeetingPrepSheetProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();

  const handleGeneratePrep = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Meeting voorbereiden
            </SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>
            Bereid je voor op je meeting met {fullName} bij {contact.companies?.name}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Contact Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Contactoverzicht
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">{fullName}</span>
                <p className="text-sm text-muted-foreground">{contact.job_title}</p>
              </div>
              {contact.function_group && (
                <div>
                  <span className="text-sm font-medium">Functiegroep:</span>
                  <p className="text-sm text-muted-foreground">{contact.function_group}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Overview */}
          {contact.companies && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Bedrijfsoverzicht
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">{contact.companies.name}</span>
                  <p className="text-sm text-muted-foreground">
                    {contact.companies.industry_label} • {contact.companies.company_size} medewerkers
                  </p>
                </div>
                
                {contact.companies.company_summary && (
                  <div>
                    <span className="text-sm font-medium">Samenvatting:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {contact.companies.company_summary}
                    </p>
                  </div>
                )}

                {contact.companies.company_keywords && contact.companies.company_keywords.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Trefwoorden:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {contact.companies.company_keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Meeting Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4" />
                AI Meeting-inzichten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Genereer AI-inzichten</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ontvang gespreksstarters, bedrijfsinzichten en meetingsuggesties.
                </p>
                <Button 
                  onClick={handleGeneratePrep}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? 'Bezig…' : 'Meeting-voorbereiding genereren'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Recente activiteit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Geen recente activiteit. Bekijk de tijdlijn voor alle communicatie.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
