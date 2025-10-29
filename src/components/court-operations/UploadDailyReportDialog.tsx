import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { enrichSessionData } from '@/services/court/pdfEnrichmentService';

interface UploadDailyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataExtracted?: (data: any[]) => void;
  buildingCode?: '100' | '111';
}

export function UploadDailyReportDialog({ 
  open, 
  onOpenChange,
  onDataExtracted,
  buildingCode = '111'
}: UploadDailyReportDialogProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'uploading' | 'extracting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please upload a PDF file.');
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 10MB.');
        return;
      }

      setFile(selectedFile);
      setExtractionStatus('idle');
      setErrorMessage('');
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    // Check authentication using the auth context
    if (!user) {
      toast.error('You must be logged in to upload court reports. Please sign in and try again.');
      return;
    }

    setIsExtracting(true);
    setExtractionStatus('uploading');

    try {
      // Step 1: Upload file to Supabase storage
      const fileName = `court-reports/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('term-pdfs')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('📄 File uploaded:', fileName);

      // Step 2: Extract data using AI
      setExtractionStatus('extracting');
      toast.info('Analyzing document with AI...');

      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-pdf', {
        body: { filePath: fileName }
      });

      if (parseError) {
        // Sanitize error message to prevent information disclosure
        console.error('[Admin Only] Parse error details:', parseError);
        throw new Error('Document extraction failed. Please ensure the file is a valid PDF and try again.');
      }

      if (!parseResult?.success) {
        const error = parseResult?.error || '';
        
        // Log detailed error for admins only
        console.error('[Admin Only] Parse result error:', error);
        
        // Check if it's a configuration error and provide helpful message
        if (error.includes('not configured') || error.includes('LOVABLE_API_KEY') || error.includes('API key')) {
          throw new Error('AI extraction service is not configured. Please contact your administrator.');
        }
        
        // Return generic error to user, don't expose internal details
        throw new Error('Failed to process the document. Please check the file format and try again.');
      }

      console.log('✅ Extraction successful:', parseResult);

      // Step 3: Transform extracted court report data to session format
      // Create ONE session per part, with all cases grouped together
      const extractedData = parseResult.extracted_data;
      console.log('📊 Frontend received extracted data:', extractedData?.entries);
      const sessions: any[] = [];

      if (extractedData?.entries) {
        console.log(`🔄 Processing ${extractedData.entries.length} part entries...`);
        for (const entry of extractedData.entries) {
          console.log(`  📍 Part ${entry.part}: Judge="${entry.judge}", Room="${entry.room_number}", Cases=${entry.cases?.length || 0}`);
          
          // Create ONE session per part with aggregated case data
          const cases = entry.cases || [];
          const caseCount = cases.length;
          
          // Aggregate all case data from the 9 columns
          const allDefendants = cases.map((c: any) => c.defendant).filter(Boolean);
          const allSendingParts = cases.map((c: any) => c.sending_part).filter(Boolean);
          const allPurposes = cases.map((c: any) => c.purpose).filter(Boolean);
          const allTransferDates = cases.map((c: any) => c.transfer_date).filter(Boolean);
          const allCharges = cases.map((c: any) => c.top_charge).filter(Boolean);
          const allStatuses = cases.map((c: any) => c.status).filter(Boolean);
          const allAttorneys = cases.map((c: any) => c.attorney).filter(Boolean);
          const allEstFinalDates = cases.map((c: any) => c.estimated_final_date).filter(Boolean);
          
          // Calculate confidence based on field completeness
          let confidence = 0.85;
          if (entry.judge && entry.part) confidence += 0.05;
          if (caseCount > 0) confidence += 0.05;
          
          sessions.push({
            part_number: entry.part,
            judge_name: entry.judge,
            calendar_day: entry.calendar_day || '',
            part_sent_by: entry.judge,
            clerk_name: '',
            room_number: '', // Will be auto-populated in review
            // Store aggregated case data
            case_count: caseCount,
            cases: cases, // Store full case details for expandable view
            sending_part: [...new Set(allSendingParts)].join('; '),
            defendants: allDefendants.join('; '),
            purpose: [...new Set(allPurposes)].join('; '),
            transfer_date: [...new Set(allTransferDates)].join('; '),
            top_charge: allCharges.join('; '),
            status: [...new Set(allStatuses)].join('; '),
            attorney: [...new Set(allAttorneys)].join('; '),
            estimated_final_date: [...new Set(allEstFinalDates)].join('; '),
            extension: '',
            papers: '',
            confidence: Math.min(confidence, 0.95)
          });
        }
      }

      console.log(`✅ Created ${sessions.length} sessions from extracted data`);

      if (sessions.length === 0) {
        throw new Error('No sessions could be extracted from the document. The document may be empty or in an unsupported format.');
      }

      // Step 4: Enrich with database information
      console.log('🔄 Enriching sessions with court data...');
      toast.info('Enriching with court data...');
      
      const enrichedSessions = await enrichSessionData(sessions, buildingCode);
      
      console.log('✅ Sessions enriched with database information');

      setExtractionStatus('success');
      toast.success(`Extracted and enriched ${enrichedSessions.length} sessions`);
      
      if (onDataExtracted) {
        onDataExtracted(enrichedSessions);
      }

      // Close dialog after short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);

    } catch (error) {
      console.error('Extraction error:', error);
      setExtractionStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Failed to extract data from document';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setExtractionStatus('idle');
    setErrorMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Daily Report</DialogTitle>
          <DialogDescription>
            Upload a PDF of the daily court report to automatically extract session data using AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select File</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isExtracting}
              >
                <Upload className="h-4 w-4 mr-2" />
                {file ? file.name : 'Choose File'}
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isExtracting}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Supported format: PDF only (max 10MB)
            </p>
          </div>

          {/* File Info */}
          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  {extractionStatus === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Extraction Status */}
          {extractionStatus === 'uploading' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Uploading document...</AlertDescription>
            </Alert>
          )}

          {extractionStatus === 'extracting' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Extracting data using AI... This may take a moment.
              </AlertDescription>
            </Alert>
          )}

          {extractionStatus === 'success' && (
            <Alert className="border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                Data extracted successfully! Review the data in the next step.
              </AlertDescription>
            </Alert>
          )}

          {extractionStatus === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage || 'Failed to extract data. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-sm font-medium mb-2">How it works:</p>
            <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Upload your daily report (PDF)</li>
              <li>AI extracts parts, judges, cases, and defendants automatically</li>
              <li>Review and edit extracted data as needed</li>
              <li>Approve to add sessions to the system</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Note:</strong> Some fields like room numbers and clerk names may need manual entry if not in the report.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isExtracting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExtract} 
            disabled={!file || isExtracting || extractionStatus === 'success'}
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Extract Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
