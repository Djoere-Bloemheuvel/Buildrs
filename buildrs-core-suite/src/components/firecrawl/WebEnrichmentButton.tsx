import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe, Sparkles, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface WebEnrichmentButtonProps {
  type: "company" | "contact";
  entityId: string;
  clientId: string;
  websiteUrl?: string;
  profileUrl?: string;
  userId?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function WebEnrichmentButton({
  type,
  entityId,
  clientId,
  websiteUrl,
  profileUrl,
  userId,
  size = "default",
  variant = "outline",
  className = ""
}: WebEnrichmentButtonProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [lastEnriched, setLastEnriched] = useState<number | null>(null);
  
  const enrichCompany = useMutation(api.firecrawl.enrichCompanyFromWebsite);
  const enrichContact = useMutation(api.firecrawl.enrichContactFromWeb);

  const handleEnrichment = async () => {
    if (!websiteUrl && !profileUrl) {
      toast.error("No website URL provided for enrichment");
      return;
    }

    setIsEnriching(true);

    try {
      let result;
      
      if (type === "company" && websiteUrl) {
        result = await enrichCompany({
          companyId: entityId as any,
          clientId: clientId as any,
          websiteUrl,
          userId
        });
      } else if (type === "contact") {
        result = await enrichContact({
          contactId: entityId as any,
          clientId: clientId as any,
          profileUrl,
          companyWebsite: websiteUrl,
          userId
        });
      }

      if (result?.success) {
        setLastEnriched(Date.now());
        toast.success(`${type === "company" ? "Company" : "Contact"} enriched successfully!`, {
          description: "Data has been updated with the latest information from the web."
        });
      } else {
        toast.error("Enrichment failed", {
          description: result?.error || "Unable to enrich data at this time."
        });
      }
    } catch (error) {
      console.error("Enrichment error:", error);
      toast.error("Enrichment failed", {
        description: "An unexpected error occurred during enrichment."
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const getButtonContent = () => {
    if (isEnriching) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Enriching...
        </>
      );
    }

    if (lastEnriched) {
      return (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          Enriched
        </>
      );
    }

    return (
      <>
        <Sparkles className="h-4 w-4 mr-2" />
        Enrich with Web Data
      </>
    );
  };

  const getTooltipContent = () => {
    if (lastEnriched) {
      const timeAgo = new Date(lastEnriched).toLocaleString();
      return `Last enriched: ${timeAgo}`;
    }

    if (type === "company") {
      return "Scrape the company website to extract additional information like company description, industry, size, and contact details.";
    }

    return "Enrich contact data using web sources like LinkedIn profiles and company information.";
  };

  const hasUrl = Boolean(websiteUrl || profileUrl);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative ${className}`}>
            <Button
              onClick={handleEnrichment}
              disabled={isEnriching || !hasUrl}
              size={size}
              variant={variant}
              className="flex items-center"
            >
              {getButtonContent()}
            </Button>
            
            {/* Status indicator */}
            {hasUrl ? (
              <div className="absolute -top-1 -right-1">
                <Badge 
                  variant={lastEnriched ? "default" : "secondary"} 
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
            <p className="font-medium">Web Data Enrichment</p>
            <p className="text-sm text-gray-600">{getTooltipContent()}</p>
            {!hasUrl && (
              <p className="text-sm text-yellow-600 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                No URL provided
              </p>
            )}
            {websiteUrl && (
              <div className="flex items-center text-xs text-gray-500">
                <Globe className="h-3 w-3 mr-1" />
                <span className="truncate">{websiteUrl}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Quick enrichment button for use in tables and cards
 */
export function QuickEnrichButton({
  type,
  entityId,
  clientId,
  websiteUrl,
  profileUrl,
  userId,
  className = ""
}: Omit<WebEnrichmentButtonProps, "size" | "variant">) {
  return (
    <WebEnrichmentButton
      type={type}
      entityId={entityId}
      clientId={clientId}
      websiteUrl={websiteUrl}
      profileUrl={profileUrl}
      userId={userId}
      size="sm"
      variant="ghost"
      className={className}
    />
  );
}

/**
 * Bulk enrichment component for enriching multiple entities
 */
interface BulkEnrichmentProps {
  type: "company" | "contact";
  entities: Array<{
    id: string;
    name: string;
    websiteUrl?: string;
    profileUrl?: string;
  }>;
  clientId: string;
  userId?: string;
  onComplete?: (results: any[]) => void;
}

export function BulkEnrichmentButton({
  type,
  entities,
  clientId,
  userId,
  onComplete
}: BulkEnrichmentProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const enrichCompany = useMutation(api.firecrawl.enrichCompanyFromWebsite);
  const enrichContact = useMutation(api.firecrawl.enrichContactFromWeb);

  const handleBulkEnrichment = async () => {
    setIsEnriching(true);
    setProgress(0);
    
    const results = [];
    
    try {
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        
        try {
          let result;
          
          if (type === "company" && entity.websiteUrl) {
            result = await enrichCompany({
              companyId: entity.id as any,
              clientId: clientId as any,
              websiteUrl: entity.websiteUrl,
              userId
            });
          } else if (type === "contact") {
            result = await enrichContact({
              contactId: entity.id as any,
              clientId: clientId as any,
              profileUrl: entity.profileUrl,
              companyWebsite: entity.websiteUrl,
              userId
            });
          }
          
          results.push({
            entityId: entity.id,
            name: entity.name,
            success: result?.success || false,
            error: result?.error
          });
          
        } catch (error) {
          results.push({
            entityId: entity.id,
            name: entity.name,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
        
        setProgress(((i + 1) / entities.length) * 100);
        
        // Add a small delay to avoid rate limiting
        if (i < entities.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      toast.success(`Bulk enrichment completed!`, {
        description: `${successCount} successful, ${failureCount} failed`
      });
      
      onComplete?.(results);
      
    } catch (error) {
      toast.error("Bulk enrichment failed", {
        description: "An unexpected error occurred during bulk enrichment."
      });
    } finally {
      setIsEnriching(false);
      setProgress(0);
    }
  };

  const validEntities = entities.filter(e => e.websiteUrl || e.profileUrl);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleBulkEnrichment}
            disabled={isEnriching || validEntities.length === 0}
            variant="outline"
            className="flex items-center"
          >
            {isEnriching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enriching... ({Math.round(progress)}%)
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Bulk Enrich ({validEntities.length})
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Enrich {validEntities.length} {type}s with web data</p>
          {validEntities.length !== entities.length && (
            <p className="text-sm text-yellow-600">
              {entities.length - validEntities.length} entities don't have URLs
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}