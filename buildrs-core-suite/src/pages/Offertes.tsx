
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Calendar, 
  DollarSign, 
  Eye,
  Edit,
  Send,
  Bot
} from 'lucide-react';

const mockOffertes = [
  {
    id: '1',
    title: 'Website Development Project',
    client: 'Tech Solutions BV',
    amount: '€15,000',
    status: 'Draft',
    createdAt: '2024-08-05',
    dueDate: '2024-08-15',
    aiGenerated: true
  },
  {
    id: '2',
    title: 'Mobile App Development',
    client: 'StartupX',
    amount: '€25,000',
    status: 'Sent',
    createdAt: '2024-08-03',
    dueDate: '2024-08-12',
    aiGenerated: true
  },
  {
    id: '3',
    title: 'Digital Marketing Campaign',
    client: 'Fashion Forward',
    amount: '€8,500',
    status: 'Accepted',
    createdAt: '2024-08-01',
    dueDate: '2024-08-10',
    aiGenerated: false
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Draft': return 'bg-yellow-100 text-yellow-800';
    case 'Sent': return 'bg-blue-100 text-blue-800';
    case 'Accepted': return 'bg-green-100 text-green-800';
    case 'Rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function Offertes() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Offertes</h1>
          <p className="text-muted-foreground">
            Beheer uw offertes en voorstellen met AI-ondersteuning
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Nieuwe AI Offerte
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Zoek offertes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Integration Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">AI-gegenereerde Offertes</h3>
              <p className="text-blue-700 text-sm">
                Maak professionele offertes in seconden met AI. Integratie met PandaDoc, n8n en Stripe voor automatische verwerking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Totaal Offertes</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">In Behandeling</p>
                <p className="text-2xl font-bold">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Geaccepteerd</p>
                <p className="text-2xl font-bold">€48.5K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">AI Gegenereerd</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offertes List */}
      <div className="space-y-4">
        {mockOffertes.map((offerte) => (
          <Card key={offerte.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{offerte.title}</h3>
                    {offerte.aiGenerated && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        AI
                      </Badge>
                    )}
                    <Badge className={getStatusColor(offerte.status)}>
                      {offerte.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-1">{offerte.client}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Aangemaakt: {offerte.createdAt}</span>
                    <span>Vervaldatum: {offerte.dueDate}</span>
                    <span className="font-semibold text-foreground">{offerte.amount}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Bekijken
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Bewerken
                  </Button>
                  {offerte.status === 'Draft' && (
                    <Button size="sm">
                      <Send className="w-4 h-4 mr-2" />
                      Versturen
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
