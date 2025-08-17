
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

  // === FETCH ALL DATA IN PARALLEL ===
  const pipelinesData = useQuery(api.pipelines.getByClient, 
    clientId ? { clientId } : "skip"
  );
  const pipelines = pipelinesData || [];

  // Determine default pipeline immediately when pipelines load
  const defaultPipeline = useMemo(() => {
    if (pipelines.length === 0) return null;
    return pipelines.find((p: Pipeline) => p.isDefault) || pipelines[0];
  }, [pipelines]);

  // Auto-select default pipeline immediately
  useEffect(() => {
    if (defaultPipeline && !activePipeline) {
      setActivePipeline(defaultPipeline._id);
    }
  }, [defaultPipeline, activePipeline]);

  // Use defaultPipeline._id as fallback to start loading stages/deals immediately
  const effectivePipelineId = activePipeline || defaultPipeline?._id;

  // === FETCH STAGES AND DEALS IN PARALLEL ===
  const stagesData = useQuery(api.stages.getByPipeline, 
    effectivePipelineId ? { pipelineId: effectivePipelineId } : "skip"
  );
  const stages = stagesData || [];

  const dealsData = useQuery(api.deals.getByPipeline, 
    effectivePipelineId ? { pipelineId: effectivePipelineId } : "skip"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Modern Header - Inspired by ABM page */}
      <div className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-40 -ml-6 w-[102.5%] -mt-6">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                Sales Pipeline
              </h1>
              <p className="text-slate-600 mt-1 font-medium">
                Beheer je deals en volg je verkoopproces
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-56">
                  <Select value={activePipeline || ''} onValueChange={setActivePipeline}>
                    <SelectTrigger className="h-11 bg-white/60 border-slate-200 focus:bg-white">
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Zoek deals..."
                    className="pl-10 w-72 h-11 bg-white/60 border-slate-200 focus:bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsPipelineModalOpen(true)} className="h-11 px-4">
                  Nieuwe Pipeline
                </Button>
                <Button 
                  onClick={handleCreateDeal} 
                  className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuwe Deal
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8">
        {/* KPI Cards - Inspired by ABM page */}
        <div className="px-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-100 font-medium">Totaal Deals</span>
                  <Target className="w-5 h-5 text-blue-200" />
                </div>
                <div className="text-3xl font-bold">{kpis.totalDeals}</div>
                <p className="text-blue-200 text-sm">in pipeline</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-emerald-100 font-medium">Pipeline Waarde</span>
                  <DollarSign className="w-5 h-5 text-emerald-200" />
                </div>
                <div className="text-3xl font-bold">{currencyFormatter(kpis.totalValue, 'EUR')}</div>
                <p className="text-emerald-200 text-sm">totale waarde</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-orange-100 font-medium">Gewogen Forecast</span>
                  <TrendingUp className="w-5 h-5 text-orange-200" />
                </div>
                <div className="text-3xl font-bold">{currencyFormatter(kpis.weighted, 'EUR')}</div>
                <p className="text-orange-200 text-sm">verwachte waarde</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-100 font-medium">Gem. Confidence</span>
                  <Building2 className="w-5 h-5 text-purple-200" />
                </div>
                <div className="text-3xl font-bold">{kpis.avgConfidence}%</div>
                <p className="text-purple-200 text-sm">gemiddelde kans</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="px-8">
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className={`flex gap-6 overflow-x-auto pb-6 transition-all duration-300 ${isDragging ? 'cursor-grabbing' : ''}`}>
          {/* Show loading skeleton if stages are not loaded yet */}
          {stages.length === 0 && stagesData === undefined ? (
            // Loading skeleton - immediate display
            Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="min-w-[350px] flex-shrink-0">
                {/* Skeleton Stage Header */}
                <div className="glass-card p-4 mb-4 bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-300 animate-pulse"></div>
                      <div>
                        <div className="h-5 w-24 bg-slate-300 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="w-8 h-6 bg-slate-300 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                {/* Skeleton Deals Container */}
                <div className="min-h-[400px] space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  {Array.from({ length: 2 }).map((_, dealIndex) => (
                    <div key={`skeleton-deal-${dealIndex}`} className="p-4 bg-white/10 rounded-lg animate-pulse">
                      <div className="h-4 w-3/4 bg-slate-300 rounded mb-3"></div>
                      <div className="h-3 w-1/2 bg-slate-200 rounded mb-2"></div>
                      <div className="flex justify-between">
                        <div className="h-3 w-16 bg-slate-200 rounded"></div>
                        <div className="h-3 w-12 bg-slate-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Actual stages when loaded
            stages.map((stage, index) => {
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
          }))}
            </div>
          </DragDropContext>
        </div>
      </div>

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
