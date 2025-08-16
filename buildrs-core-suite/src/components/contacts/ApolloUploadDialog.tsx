import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAction, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface UploadResult {
  processed: number;
  contactsCreated: number;
  companiesCreated: number;
  duplicatesSkipped: number;
  filteredOut: number;
  message: string;
}

export default function ApolloUploadDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonlUrl, setJsonlUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  
  // Clear any cached client IDs
  React.useEffect(() => {
    localStorage.removeItem('cached-client-id');
  }, []);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const processApolloData = useAction(api.apolloProcessor.processApolloData);
  // Remove testQuery - not needed
  const firstClient = null;

  const handleUpload = async () => {
    if (!jsonlUrl.trim()) {
      setError('Please provide a valid JSONL URL');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setUploadResult(null);
    setIsCancelled(false);
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // No client needed for leads/companies upload to global marketplace
      const clientId = "global_marketplace";
      console.log('🆔 Using clientId for global marketplace upload:', clientId);
      
      const result = await processApolloData({
        jsonlUrl: jsonlUrl.trim(),
        clientId,
      });

      if (!isCancelled) {
        setUploadResult(result);
      }
    } catch (err) {
      if (!isCancelled) {
        setError(err instanceof Error ? err.message : 'Failed to process Apollo data');
      }
    } finally {
      if (!isCancelled) {
        setIsProcessing(false);
      }
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    setIsCancelled(true);
    setIsProcessing(false);
    setError('Upload stopped by user');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleClose = () => {
    // Stop any ongoing upload
    if (isProcessing) {
      handleStop();
    }
    
    setIsOpen(false);
    setJsonlUrl('');
    setUploadResult(null);
    setError(null);
    setIsProcessing(false);
    setIsCancelled(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Apollo.io Data
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Apollo.io Lead Data
          </DialogTitle>
          <DialogDescription>
            Upload JSONL data from Apollo.io scraper. This will automatically process contacts, 
            validate companies, and classify function groups using GPT-5-mini AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="jsonl-url">Apollo.io JSONL Data URL</Label>
            <Input
              id="jsonl-url"
              placeholder="https://your-storage.com/apollo-data.jsonl"
              value={jsonlUrl}
              onChange={(e) => setJsonlUrl(e.target.value)}
              disabled={isProcessing}
            />
            <p className="text-sm text-muted-foreground">
              Provide the URL to your Apollo.io JSONL export file
            </p>
          </div>

          {/* Processing Features */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3">Processing Features</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Duplicate Detection
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Website Validation
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                AI Function Classification
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Company Enrichment
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Processing Apollo.io data...</span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStop}
                  className="h-8 px-3"
                >
                  <X className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              </div>
              <Progress value={undefined} className="w-full" />
              <p className="text-xs text-muted-foreground">
                This may take a few minutes depending on the data size. You can stop the process anytime.
              </p>
            </div>
          )}

          {/* Results Display */}
          {uploadResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Processing Complete!</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Processed:</span>
                    <Badge variant="secondary">{uploadResult.processed}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Contacts Created:</span>
                    <Badge variant="default">{uploadResult.contactsCreated}</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Companies Created:</span>
                    <Badge variant="default">{uploadResult.companiesCreated}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duplicates Skipped:</span>
                    <Badge variant="outline">{uploadResult.duplicatesSkipped}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Filtered Out:</span>
                    <Badge variant="destructive">{uploadResult.filteredOut}</Badge>
                  </div>
                </div>
              </div>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{uploadResult.message}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              {uploadResult ? 'Close' : 'Cancel'}
            </Button>
            
            {!uploadResult && (
              <Button onClick={handleUpload} disabled={isProcessing || !jsonlUrl.trim()}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}