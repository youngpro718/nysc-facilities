import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface UploadDailyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataExtracted?: (data: any[]) => void;
}

export function UploadDailyReportDialog({ 
  open, 
  onOpenChange,
  onDataExtracted 
}: UploadDailyReportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'uploading' | 'extracting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
        'image/jpg'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Invalid file type. Please upload PDF, Word, or Image files.');
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

    setIsExtracting(true);
    setExtractionStatus('uploading');

    try {
      // ============================================================================
      // TODO: LOVABLE AI INTEGRATION POINT
      // ============================================================================
      // 
      // This is where Lovable's Google AI Cloud integration should be implemented.
      // 
      // REQUIRED FUNCTIONALITY:
      // 1. Convert file to base64 or upload to temporary storage
      // 2. Send to Google Cloud Vision API or Gemini API
      // 3. Extract table data from the document
      // 4. Parse the extracted text into structured format
      // 
      // EXPECTED INPUT:
      // - file: File object (PDF, Word doc, or Image)
      // 
      // EXPECTED OUTPUT FORMAT:
      // Array of objects with these fields:
      // [
      //   {
      //     part_number: string,        // e.g., "TAP A"
      //     judge_name: string,         // e.g., "M. IREY (J)"
      //     part_sent_by: string,       // e.g., "M. IREY (J)"
      //     defendants: string,         // Defendant names
      //     clerk_name: string,         // e.g., "BRG"
      //     room_number: string,        // e.g., "1014"
      //     purpose: string,            // e.g., "ATT", "MURD 2"
      //     top_charge: string,         // Charge type
      //     status: string,             // e.g., "HBG CONT'D 10/23", "JUDGE OUT"
      //     attorney: string,           // Attorney name
      //     extension: string,          // Phone extension
      //     papers: string,             // "OWN" or "DWN"
      //     confidence: number          // 0-1, extraction confidence
      //   }
      // ]
      // 
      // ERROR HANDLING:
      // - Throw error with descriptive message if extraction fails
      // - Include which fields had low confidence
      // 
      // IMPLEMENTATION NOTES:
      // - Use Lovable's built-in Google AI integration
      // - Handle multi-page documents
      // - Preserve table structure
      // - Extract all rows from the daily report
      // 
      // EXAMPLE API CALL (pseudo-code):
      // const result = await lovable.ai.extractTableData(file, {
      //   provider: 'google-cloud-vision',
      //   tableFormat: 'daily-court-report',
      //   columns: ['part', 'judge', 'clerk', 'room', 'status', 'attorney']
      // });
      // 
      // ============================================================================

      setExtractionStatus('extracting');

      // TEMPORARY: Mock extraction for development
      // Replace this entire section with actual Lovable AI integration
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      const mockExtractedData = [
        {
          part_number: 'TAP A',
          judge_name: 'M. IREY (J)',
          part_sent_by: 'M. IREY (J)',
          defendants: 'Sample Defendant',
          clerk_name: 'BRG',
          room_number: '1014',
          purpose: 'ATT',
          top_charge: 'MURD 2',
          status: 'HBG CONT\'D 10/23',
          attorney: 'M. FUSSMAN',
          extension: '1829',
          papers: 'OWN',
          confidence: 0.95
        }
      ];

      // END TEMPORARY MOCK DATA

      setExtractionStatus('success');
      toast.success(`Extracted ${mockExtractedData.length} sessions from document`);
      
      if (onDataExtracted) {
        onDataExtracted(mockExtractedData);
      }

      // Close dialog after short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);

    } catch (error) {
      console.error('Extraction error:', error);
      setExtractionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to extract data from document');
      toast.error('Extraction failed. Please try again or contact support.');
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
            Upload a Word document, PDF, or image of the daily court report to automatically extract session data.
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
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                disabled={isExtracting}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, Word (.doc, .docx), Images (.png, .jpg)
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
              <li>Upload your daily report (Word, PDF, or image)</li>
              <li>AI will extract the table data automatically</li>
              <li>Review and edit any extracted data</li>
              <li>Approve to add sessions to the system</li>
            </ol>
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
