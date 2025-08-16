
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, Search, Building2, User, TrendingUp, Calendar, DollarSign, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NewDealModal from '@/components/deals/NewDealModal';
import NewPipelineModal from '@/components/deals/NewPipelineModal';
import { useToast } from '@/hooks/use-toast';
import { currencyFormatter } from '@/utils';
import { useConvexAuth } from '@/hooks/useConvexAuth';
import { useNavigate } from 'react-router-dom';
import type { Id } from "../../convex/_generated/dataModel";

interface Deal {
  _id: Id<"deals">;
  title: string;
  value?: number;
  currency: string;
  stageId: Id<"stages">;
  confidence: number;
  companyId?: Id<"companies">;
  companies?: {
    name: string;
  };
}

interface Stage {
  _id: Id<"stages">;
  name: string;
  position: number;
  pipelineId: Id<"pipelines">;
  defaultProbability?: number;
}

interface Pipeline {
  _id: Id<"pipelines">;
  name: string;
  isDefault?: boolean;
}

const stageColors = [
  { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20', accent: 'text-blue-400', icon: Target },
  { bg: 'from-purple-500/10 to-purple-600/5', border: 'border-purple-500/20', accent: 'text-purple-400', icon: User },
  { bg: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/20', accent: 'text-emerald-400', icon: TrendingUp },
  { bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-500/20', accent: 'text-orange-400', icon: Calendar },
  { bg: 'from-green-500/10 to-green-600/5', border: 'border-green-500/20', accent: 'text-green-400', icon: DollarSign },
];

const Deals = () => {
  const [search, setSearch] = useState('');
  const [activePipeline, setActivePipeline] = useState<Id<"pipelines"> | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { user, getClientId } = useConvexAuth();
  const clientId = getClientId();
  const navigate = useNavigate();
  const { toast } = useToast();

  // === FETCH PIPELINES ===
  const pipelinesData = useQuery(api.pipelines.getByClient, 
    clientId ? { clientId } : "skip"
  );
  const pipelines = pipelinesData || [];

  // Auto-select default pipeline
  useEffect(() => {
    if (pipelines.length > 0 && !activePipeline) {
      const defaultPipeline = pipelines.find((p: Pipeline) => p.isDefault) || pipelines[0];
      setActivePipeline(defaultPipeline._id);
    }
  }, [pipelines, activePipeline]);

  // === FETCH STAGES ===
  const stagesData = useQuery(api.stages.getByPipeline, 
    activePipeline ? { pipelineId: activePipeline } : "skip"
  );
  const stages = stagesData || [];

  // === FETCH DEALS ===
  const dealsData = useQuery(api.deals.getByPipeline, 
    activePipeline ? { pipelineId: activePipeline } : "skip"
  );
  const deals = dealsData || [];

  // === MOVE DEAL MUTATION ===
  const moveDealMutation = useMutation(api.deals.update);

  // === DRAG & DROP ===
  const onDragStart = () => {
    setIsDragging(true);
  };

  const onDragEnd = async (result: any) => {
    setIsDragging(false);
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    const nextStage = stages.find(s => s._id === destination.droppableId);
    const nextConfidence = typeof nextStage?.defaultProbability === 'number' ? nextStage!.defaultProbability! : undefined;
    
    try {
      await moveDealMutation({
        id: draggableId as Id<"deals">,
        stageId: destination.droppableId as Id<"stages">,
        confidence: nextConfidence
      });
      
      toast({ 
        title: 'Deal verplaatst', 
        description: `Deal succesvol verplaatst naar ${nextStage?.name}`, 
        variant: 'default',
        duration: 2000 
      });
    } catch (error: any) {
      toast({ 
        title: 'Verplaatsen mislukt', 
        description: error?.message || 'Er ging iets mis. Probeer het opnieuw.', 
        variant: 'destructive',
        duration: 4000 
      });
    }
  };

  const handleCreateDeal = () => {
    setIsCreateModalOpen(true);
  };

  const handleDealCreated = (pipelineId?: Id<"pipelines">) => {
    if (pipelineId && pipelineId !== activePipeline) {
      setActivePipeline(pipelineId);
    }
    // Convex handles real-time updates automatically
  };

  const searchLower = search.toLowerCase();
  const filteredDeals = useMemo(() => {
    if (!searchLower) return deals;
    return deals.filter(deal => {
      const t = deal.title?.toLowerCase() || '';
      const c = deal.companies?.name?.toLowerCase() || '';
      return t.includes(searchLower) || c.includes(searchLower);
    });
  }, [deals, searchLower]);

  const getStageStyle = (index: number) => {
    const colorIndex = index % stageColors.length;
    return stageColors[colorIndex];
  };

  const getStageStats = (stageId: Id<"stages">) => {
    const stageDeals = filteredDeals.filter(deal => deal.stageId === stageId);
    const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    return { count: stageDeals.length, totalValue };
  };

  // Compact KPIs (gewogen forecast)
  const kpis = useMemo(() => {
    const totalDeals = filteredDeals.length;
    const totalValue = filteredDeals.reduce((s, d) => s + (d.value || 0), 0);
    const weighted = filteredDeals.reduce((s, d) => s + (d.value || 0) * ((d.confidence || 0) / 100), 0);
    const avgConfidence = totalDeals ? Math.round(filteredDeals.reduce((s, d) => s + (d.confidence || 0), 0) / totalDeals) : 0;
    return { totalDeals, totalValue, weighted, avgConfidence };
  }, [filteredDeals]);

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sales Pipeline
            </h1>
            <p className="text-muted-foreground mt-1">
              Beheer je deals en volg je verkoopproces
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsPipelineModalOpen(true)} className="h-12 px-4 border-white/20">
              Nieuwe Pipeline
            </Button>
            <Button onClick={handleCreateDeal} className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Deal
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <div className="w-72">
          <Select value={activePipeline || ''} onValueChange={setActivePipeline}>
            <SelectTrigger className="h-12 glass-card border-white/20">
              <SelectValue placeholder="Selecteer Pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((pipeline: Pipeline) => (
                <SelectItem key={pipeline._id} value={pipeline._id}>
                  {pipeline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 pl-10 glass-card border-white/20"
          />
        </div>
      </div>

      {/* Compact KPIs */}
      <div className="glass-card p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Totaal deals</p>
          <p className="text-lg font-semibold">{kpis.totalDeals}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Pipeline waarde</p>
          <p className="text-lg font-semibold">{currencyFormatter(kpis.totalValue, 'EUR')}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Gewogen forecast</p>
          <p className="text-lg font-semibold">{currencyFormatter(kpis.weighted, 'EUR')}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Gem. confidence</p>
          <p className="text-lg font-semibold">{kpis.avgConfidence}%</p>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className={`flex gap-6 overflow-x-auto pb-6 transition-all duration-300 ${isDragging ? 'cursor-grabbing' : ''}`}>
          {stages.map((stage, index) => {
            const stageStyle = getStageStyle(index);
            const stats = getStageStats(stage._id);
            const IconComponent = stageStyle.icon;

            return (
              <div key={stage._id} className={`min-w-[350px] flex-shrink-0 transition-all duration-300 ${isDragging ? 'scale-[0.98]' : ''}`}>
                {/* Stage Header */}
                <div className={`glass-card p-4 mb-4 bg-gradient-to-br ${stageStyle.bg} border ${stageStyle.border} transition-all duration-300 ${isDragging ? 'shadow-lg ring-1 ring-white/10' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center`}>
                        <IconComponent className={`w-5 h-5 ${stageStyle.accent}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{stage.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {stats.count} deals • {currencyFormatter(stats.totalValue, 'EUR')}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full bg-white/10 border border-white/20`}>
                      <span className="text-sm font-medium">{stats.count}</span>
                    </div>
                  </div>
                </div>

                {/* Deals Container */}
                <Droppable droppableId={stage._id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`min-h-[400px] space-y-3 p-4 rounded-xl transition-all duration-300 ease-out ${snapshot.isDraggingOver ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-dashed border-blue-500/30 shadow-lg scale-[1.02] transform' : 'bg-white/5 border border-white/10 hover:bg-white/10'} ${
                        snapshot.isDraggingOver 
                          ? `bg-gradient-to-br ${stageStyle.bg} border-2 ${stageStyle.border} border-dashed shadow-lg scale-[1.02] transform` 
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                      style={{
                        backgroundColor: snapshot.isDraggingOver ? 'rgba(255, 255, 255, 0.08)' : undefined,
                        transform: snapshot.isDraggingOver ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: snapshot.isDraggingOver 
                          ? `0 10px 25px -5px ${stageStyle.accent.replace('text-', 'rgba(').replace('400', '0.3)')}, 0 0 0 1px rgba(255, 255, 255, 0.1)`
                          : undefined,
                      }}
                    >
                      {filteredDeals
                        .filter((deal) => deal.stageId === stage._id)
                        .map((deal, index) => (
                          <Draggable key={deal._id} draggableId={deal._id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                onClick={() => !snapshot.isDragging && navigate(`/deals/${deal._id}`)}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-grab active:cursor-grabbing transition-all duration-300 ease-out glass-card border-white/20 hover:shadow-xl hover:scale-[1.02] hover:bg-white/10 ${snapshot.isDragging ? 'rotate-2 scale-110 shadow-2xl ring-2 ring-white/20 bg-white/20 z-50' : 'hover:rotate-0'} ${
                                  snapshot.isDragging 
                                    ? 'rotate-2 scale-110 shadow-2xl ring-2 ring-white/20 bg-white/20 z-50' 
                                    : 'hover:rotate-0'
                                }`}
                                style={{
                                  transform: snapshot.isDragging 
                                    ? `rotate(2deg) scale(1.1) ${provided.draggableProps.style?.transform || ''}` 
                                    : provided.draggableProps.style?.transform,
                                  opacity: snapshot.isDragging ? 0.95 : 1,
                                  boxShadow: snapshot.isDragging 
                                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)' 
                                    : undefined,
                                }}
                              >
                                <CardContent className="p-5">
                                  <div className="space-y-4">
                                    {/* Deal Title */}
                                    <h4 className="font-semibold text-sm leading-relaxed line-clamp-2">
                                      {deal.title}
                                    </h4>
                                    
                                    {/* Company */}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Building2 className="w-3 h-3" />
                                      <span className="truncate">{deal.companies?.name}</span>
                                    </div>

                                    {/* Value & Confidence */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1">
                                        <DollarSign className="w-3 h-3 text-emerald-400" />
                                        <span className="text-sm font-semibold">
                                          {currencyFormatter(deal.value, deal.currency)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-blue-400" />
                                        <span className="text-xs text-muted-foreground">
                                          {deal.confidence}%
                                        </span>
                                      </div>
                                    </div>

                                    {/* Confidence Bar */}
                                    <div className="w-full bg-white/10 rounded-full h-1.5">
                                      <div 
                                        className={`h-full rounded-full bg-gradient-to-r ${stageStyle.bg.replace('/10', '/40').replace('/5', '/20')}`}
                                        style={{ width: `${deal.confidence}%` }}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <NewDealModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        pipelines={pipelines}
        activePipeline={activePipeline}
        onCreated={handleDealCreated}
      />
      <NewPipelineModal 
        open={isPipelineModalOpen} 
        onOpenChange={setIsPipelineModalOpen} 
        onCreated={() => {/* Convex handles real-time updates */}} 
      />
    </div>
  );
};

export default Deals;
