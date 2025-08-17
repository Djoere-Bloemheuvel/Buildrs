import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, Loader2, CheckCircle, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";

interface ResearchButtonProps {
  type: "company" | "contact" | "industry" | "meeting" | "techstack";
  entityId?: string;
  clientId: string;
  entityName: string;
  companyName?: string;
  websiteUrl?: string;
  jobTitle?: string;
  userId?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  meetingContext?: string;
  industry?: string;
}

export function ResearchButton({
  type,
  entityId,
  clientId,
  entityName,
  companyName,
  websiteUrl,
  jobTitle,
  userId,
  size = "default",
  variant = "outline",
  className = "",
  meetingContext,
  industry
}: ResearchButtonProps) {
  const [isResearching, setIsResearching] = useState(false);
  const [lastResearched, setLastResearched] = useState<number | null>(null);
  
  const researchCompany = useMutation(api.perplexity.researchCompanyWithAI);
  const researchContact = useMutation(api.perplexity.researchContactWithAI);
  const researchIndustry = useMutation(api.perplexity.researchIndustryWithAI);
  const generateTalkingPoints = useMutation(api.perplexity.generateMeetingTalkingPoints);
  const researchTechStack = useMutation(api.perplexity.researchTechStackWithAI);

  const handleResearch = async () => {
    if (!entityName) {
      toast.error("No entity name provided for research");
      return;
    }

    setIsResearching(true);

    try {
      let result;
      
      switch (type) {
        case "company":
          result = await researchCompany({
            companyId: entityId as any,
            clientId: clientId as any,
            companyName: entityName,
            websiteUrl,
            userId
          });
          break;
          
        case "contact":
          if (!companyName) {
            toast.error("Company name required for contact research");
            return;
          }
          result = await researchContact({
            contactId: entityId as any,
            clientId: clientId as any,
            contactName: entityName,
            companyName,
            jobTitle,
            userId
          });
          break;
          
        case "industry":
          result = await researchIndustry({
            clientId: clientId as any,
            industry: industry || entityName,
            focus: "trends",
            userId
          });
          break;
          
        case "meeting":
          if (!companyName) {
            toast.error("Company name required for meeting preparation");
            return;
          }
          result = await generateTalkingPoints({
            contactId: entityId as any,
            clientId: clientId as any,
            contactName: entityName,
            companyName,
            meetingContext,
            userId
          });
          break;
          
        case "techstack":
          result = await researchTechStack({
            companyId: entityId as any,
            clientId: clientId as any,
            companyName: entityName,
            websiteUrl,
            userId
          });
          break;
          
        default:
          toast.error("Invalid research type");
          return;
      }

      if (result?.success) {
        setLastResearched(Date.now());
        toast.success(`${getTypeLabel()} research completed!`, {
          description: "AI-powered insights have been generated and saved."
        });
      } else {
        toast.error("Research failed", {
          description: result?.error || "Unable to generate research at this time."
        });
      }
    } catch (error) {
      console.error("Research error:", error);
      toast.error("Research failed", {
        description: "An unexpected error occurred during research."
      });
    } finally {
      setIsResearching(false);
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "company": return "Company";
      case "contact": return "Contact";
      case "industry": return "Industry";
      case "meeting": return "Meeting prep";
      case "techstack": return "Tech stack";
      default: return "Research";
    }
  };

  const getButtonContent = () => {
    if (isResearching) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Researching...
        </>
      );
    }

    if (lastResearched) {
      return (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          Researched
        </>
      );
    }

    return (
      <>
        <Brain className="h-4 w-4 mr-2" />
        Research with AI
      </>
    );
  };

  const getTooltipContent = () => {
    if (lastResearched) {
      const timeAgo = new Date(lastResearched).toLocaleString();
      return `Last researched: ${timeAgo}`;
    }

    switch (type) {
      case "company":
        return "Use AI to research company information, recent news, industry position, and key insights.";
      case "contact":
        return "Research contact's professional background, achievements, and relevant business insights.";
      case "industry":
        return "Get AI-powered industry analysis including trends, challenges, and opportunities.";
      case "meeting":
        return "Generate AI-powered talking points and meeting preparation insights.";
      case "techstack":
        return "Research the company's technology stack, tools, and technical infrastructure.";
      default:
        return "Generate AI-powered research insights using Perplexity.";
    }
  };

  const hasRequiredData = Boolean(entityName && (type !== "contact" || companyName));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative ${className}`}>
            <Button
              onClick={handleResearch}
              disabled={isResearching || !hasRequiredData}
              size={size}
              variant={variant}
              className="flex items-center"
            >
              {getButtonContent()}
            </Button>
            
            {/* Status indicator */}
            {hasRequiredData ? (
              <div className="absolute -top-1 -right-1">
                <Badge 
                  variant={lastResearched ? "default" : "secondary"} 
                  className="h-2 w-2 p-0 rounded-full"
                />
              </div>
            ) : (
              <div className="absolute -top-1 -right-1">
                <AlertCircle className="h-3 w-3 text-yellow-600" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">AI Research - {getTypeLabel()}</p>
            <p className="text-sm text-gray-600">{getTooltipContent()}</p>
            {!hasRequiredData && (
              <p className="text-sm text-yellow-600 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Missing required data
              </p>
            )}
            <div className="flex items-center text-xs text-gray-500">
              <Search className="h-3 w-3 mr-1" />
              <span>Powered by Perplexity AI</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Quick research button for use in tables and cards
 */
export function QuickResearchButton({
  type,
  entityId,
  clientId,
  entityName,
  companyName,
  websiteUrl,
  jobTitle,
  userId,
  className = ""
}: Omit<ResearchButtonProps, "size" | "variant">) {
  return (
    <ResearchButton
      type={type}
      entityId={entityId}
      clientId={clientId}
      entityName={entityName}
      companyName={companyName}
      websiteUrl={websiteUrl}
      jobTitle={jobTitle}
      userId={userId}
      size="sm"
      variant="ghost"
      className={className}
    />
  );
}

/**
 * Research panel component for detailed research insights
 */
interface ResearchPanelProps {
  type: "company" | "contact";
  entityId: string;
  clientId: string;
  entityName: string;
  companyName?: string;
  websiteUrl?: string;
  jobTitle?: string;
  userId?: string;
}

export function ResearchPanel({
  type,
  entityId,
  clientId,
  entityName,
  companyName,
  websiteUrl,
  jobTitle,
  userId
}: ResearchPanelProps) {
  const [activeResearch, setActiveResearch] = useState<string | null>(null);

  const researchTypes = type === "company" 
    ? [
        { key: "company", label: "Company Overview", icon: Brain },
        { key: "industry", label: "Industry Analysis", icon: Search },
        { key: "techstack", label: "Technology Stack", icon: Brain }
      ]
    : [
        { key: "contact", label: "Professional Profile", icon: Brain },
        { key: "meeting", label: "Meeting Preparation", icon: Search }
      ];

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center space-x-2">
        <Brain className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">AI Research Panel</h3>
        <Badge variant="outline" className="text-xs">Powered by Perplexity</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {researchTypes.map((researchType) => (
          <ResearchButton
            key={researchType.key}
            type={researchType.key as any}
            entityId={entityId}
            clientId={clientId}
            entityName={entityName}
            companyName={companyName}
            websiteUrl={websiteUrl}
            jobTitle={jobTitle}
            userId={userId}
            size="sm"
            variant="outline"
            className="justify-start"
          />
        ))}
      </div>
    </div>
  );
}