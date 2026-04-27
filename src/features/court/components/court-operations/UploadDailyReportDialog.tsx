import { useState } from 'react';
import { ModalFrame } from '@shared/components/common/common/ModalFrame';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@features/auth/hooks/useAuth';
import { logger } from '@/lib/logger';
import { STORAGE_BUCKETS } from '@/config';
import { batchMapPartsToCourtrooms } from '@features/court/services/courtroomMappingService';
import { PDFExtractionPreview, type ExtractedPart } from './PDFExtractionPreview';
import { validateBatch, getValidationSummary } from '@features/court/services/sessionValidation';
import { parseDailyReportPDF } from '@features/court/services/dailyReportParser';
import { getErrorMessage } from '@/lib/errorUtils';

interface UploadDailyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataExtracted?: (data: unknown[]) => void;
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
  const [extractCooldown, setExtractCooldown] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'uploading' | 'extracting' | 'enriching' | 'preview' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [extractedParts, setExtractedParts] = useState<ExtractedPart[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Array<{ id: string; room_number: string; name: string }>>([]);

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
    if (!file || extractCooldown) return;
    setExtractCooldown(true);
    setTimeout(() => setExtractCooldown(false), 30_000);

    // Check authentication using the auth context
    if (!user) {
      toast.error('You must be logged in to upload court reports. Please sign in and try again.');
      return;
    }

    setIsExtracting(true);
    setExtractionStatus('uploading');

    try {
      // Step 1: Parse PDF locally using coordinate-based extraction
      setExtractionStatus('extracting');
      toast.info('Analyzing document...');

      const parseResult = await parseDailyReportPDF(file);

      if (!parseResult.success || !parseResult.extracted_data) {
        throw new Error(parseResult.error || 'Failed to process the document. Please check the file format and try again.');
      }

      logger.debug('✅ Extraction successful:', parseResult);

      // Step 2: Upload file to Supabase storage for archival
      setExtractionStatus('uploading');
      const fileName = `court-reports/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.termPdfs)
        .upload(fileName, file);

      if (uploadError) {
        // Non-critical — extraction already succeeded, just log the upload failure
        logger.warn('File archival upload failed (non-critical):', uploadError.message);
      }

      // Step 3: Map parts to courtrooms
      setExtractionStatus('enriching');
      toast.info('Mapping parts to courtrooms...');

      const extractedData = parseResult.extracted_data;
      const entries = extractedData.entries || [];

      if (entries.length === 0) {
        throw new Error('No sessions could be extracted from the document.');
      }

      // Load available courtrooms for manual mapping
      const { data: rooms } = await supabase
        .from('court_rooms')
        .select(`
          id,
          room_number,
          courtroom_number,
          rooms!inner(
            name,
            floors!inner(
              buildings!inner(address)
            )
          )
        `)
        .eq('is_active', true);

      const filteredRooms = (rooms || [])
        .filter((r: any) => r.rooms?.floors?.buildings?.address?.includes(`${buildingCode} Centre`))
        .map((r: any) => ({
          id: r.id as string,
          room_number: r.room_number as string,
          name: (r.rooms?.name || r.courtroom_number || r.room_number) as string,
        }));

      setAvailableRooms(filteredRooms);

      // Batch map all parts to courtrooms
      const partsToMap = entries.map((e) => ({
        part_number: e.part,
        building_code: buildingCode,
      }));

      const mappings = await batchMapPartsToCourtrooms(partsToMap);
      logger.debug(`📍 Mapped ${mappings.size} of ${entries.length} parts`);

      // Transform to ExtractedPart format with mapping info
      const transformedParts: ExtractedPart[] = entries.map((entry) => {
        const mapping = mappings.get(entry.part);
        
        return {
          ...entry,
          room_number: mapping?.room_number || '',
          courtroom_id: mapping?.courtroom_id,
          mapping_status: (mapping ? 'found' : 'not_found') as 'found' | 'not_found',
          mapping_message: mapping
            ? `Mapped to ${mapping.room_name} (${mapping.room_number})`
            : `Part "${entry.part}" not found in database. Please select manually.`,
          needs_review: !mapping || entry.confidence < 0.85,
        };
      });

      logger.debug(`✅ Prepared ${transformedParts.length} parts for preview`);

      // Validate all parts
      const validationResults = validateBatch(transformedParts, buildingCode);
      const summary = getValidationSummary(validationResults);

      if (summary.hasErrors) {
        toast.warning(`Found ${summary.totalErrors} validation errors. Please review before importing.`);
      }

      setExtractedParts(transformedParts);
      setExtractionStatus('preview');
      toast.success(`Ready to preview ${transformedParts.length} extracted parts`);

    } catch (error) {
      logger.error('Extraction error:', error);
      setExtractionStatus('error');
      const errorMsg = getErrorMessage(error) || 'Failed to extract data from document';
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
    setExtractedParts([]);
    onOpenChange(false);
  };

  const handleAcceptParts = async (selectedParts: ExtractedPart[]) => {
    logger.debug(`📥 Importing ${selectedParts.length} selected parts...`);
    
    // Transform to session format matching court_sessions DB columns
    const sessions = selectedParts.map(part => {
      // Parse calendar count from status text like "CALENDAR (22)" or "CALENDAR 3/2 (31)"
      const allStatuses = part.cases.map(c => c.status).filter(Boolean).join('; ');
      let calendarCount: number | null = null;
      let calendarCountDate: string | null = null;
      const calMatch = allStatuses.match(/CALENDAR\s+(\d{1,2}\/\d{1,2})?\s*\((\d+)\)/i);
      if (calMatch) {
        if (calMatch[1]) calendarCountDate = calMatch[1];
        calendarCount = parseInt(calMatch[2], 10);
      }

      return {
        part_number: part.part,
        judge_name: part.judge,
        calendar_day: part.calendar_day,
        court_room_id: part.courtroom_id,
        room_number: part.room_number,
        out_dates: part.out_dates || [],
        // Aggregate case data → court_sessions columns
        defendants: part.cases.map(c => c.defendant).filter(Boolean).join('; '),
        parts_entered_by: [...new Set(part.cases.map(c => c.sending_part).filter(Boolean))].join('; '),
        purpose: [...new Set(part.cases.map(c => c.purpose).filter(Boolean))].join('; '),
        date_transferred_or_started: part.cases.map(c => c.transfer_date).filter(Boolean)[0] || null,
        top_charge: part.cases.map(c => c.top_charge).filter(Boolean).join('; '),
        attorney: [...new Set(part.cases.map(c => c.attorney).filter(Boolean))].join('; '),
        estimated_finish_date: part.cases.map(c => c.estimated_final_date).filter(Boolean)[0] || null,
        status_detail: allStatuses || null,
        calendar_count: calendarCount,
        calendar_count_date: calendarCountDate,
      };
    });

    setExtractionStatus('success');
    toast.success(`Importing ${sessions.length} court sessions`);

    if (onDataExtracted) {
      onDataExtracted(sessions);
    }

    // Close dialog
    setTimeout(() => {
      onOpenChange(false);
      setFile(null);
      setExtractedParts([]);
      setExtractionStatus('idle');
    }, 500);
  };

  const handleBackToUpload = () => {
    setExtractedParts([]);
    setExtractionStatus('idle');
  };

  // Show preview if we have extracted parts
  if (extractionStatus === 'preview' && extractedParts.length > 0) {
    return (
      <ModalFrame
        open={open}
        onOpenChange={onOpenChange}
        size="xl"
        title="Review Extracted Data"
        description="Review and edit the extracted court session data before importing."
      >
        <PDFExtractionPreview
          parts={extractedParts}
          buildingCode={buildingCode}
          onAccept={handleAcceptParts}
          onCancel={handleBackToUpload}
          availableRooms={availableRooms}
        />
      </ModalFrame>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Daily Report</DialogTitle>
          <DialogDescription>
            Upload a PDF of the daily court report to automatically extract session data.
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
                Extracting data from PDF... This may take a moment.
              </AlertDescription>
            </Alert>
          )}

          {extractionStatus === 'enriching' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Mapping parts to courtrooms and enriching data...
              </AlertDescription>
            </Alert>
          )}

          {extractionStatus === 'success' && (
            <Alert className="border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
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
              <li>Parts, judges, cases, and defendants are extracted automatically</li>
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
            disabled={!file || isExtracting || extractCooldown || extractionStatus === 'success'}
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : extractCooldown ? (
              'Please wait...'
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
