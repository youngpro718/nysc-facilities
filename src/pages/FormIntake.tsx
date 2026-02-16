// @ts-nocheck
import { useState } from 'react';
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuickProcessDialog } from '@/components/forms/QuickProcessDialog';
import { CourtReportPreview } from '@/components/court-reports/CourtReportPreview';

export default function FormIntake() {
  const [uploading, setUploading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Record<string, unknown> | null>(null);
  const [selectedCourtReport, setSelectedCourtReport] = useState<Record<string, unknown> | null>(null);
  const queryClient = useQueryClient();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['form-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: courtReports } = useQuery({
    queryKey: ['court-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('court_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    toast.info('Uploading form...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to storage
      const fileName = `staff/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('form-pdfs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Extract form data using AI
      toast.info('Extracting form data with AI...');
      
      const { data: extractionResult, error: extractionError } = await supabase.functions.invoke(
        'extract-form-data',
        { body: { filePath: fileName } }
      );

      let extractedData = {
        uploaded_by_staff: true,
        staff_user_id: user.id,
        uploaded_at: new Date().toISOString(),
      };

      let initialFormType = 'unknown';

      if (!extractionError && extractionResult?.success) {
        logger.debug('AI extraction successful:', extractionResult.extracted_data);
        extractedData = {
          ...extractedData,
          ...extractionResult.extracted_data,
          ai_extracted: true,
        };
        // Set form type if AI detected it
        if (extractionResult.extracted_data.form_type) {
          initialFormType = extractionResult.extracted_data.form_type;
        }
      } else {
        logger.warn('AI extraction failed, will require manual entry:', extractionError);
      }

      // Create submission record with extracted data
      const { data: submission, error: submissionError } = await supabase
        .from('form_submissions')
        .insert({
          pdf_file_path: fileName,
          form_type: initialFormType,
          uploaded_by: user.id,
          processing_status: 'pending',
          extracted_data: extractedData,
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      if (extractionResult?.success) {
        toast.success('Form uploaded with AI-extracted data!', {
          description: 'Review and confirm the extracted information.',
        });
      } else {
        toast.success('Form uploaded! Click to process it.', {
          description: 'AI extraction unavailable - please enter details manually.',
        });
      }

      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
    } catch (error) {
      logger.error('Upload error:', error);
      toast.error(getErrorMessage(error) || 'Failed to upload form');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: uploading,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, unknown> = {
      processed: 'default',
      completed: 'default',
      failed: 'destructive',
      pending: 'secondary',
    };
    const labels: Record<string, string> = {
      processed: 'Processed',
      completed: 'Processed',
      pending: 'Needs Processing',
      failed: 'Failed',
    };
    return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Form Intake System</h1>
          <p className="text-muted-foreground">
            Upload completed forms - All submissions are tracked in the app system
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/form-templates'}>
          <FileText className="w-4 h-4 mr-2" />
          View Form Templates
        </Button>
      </div>

      {/* Upload Area */}
      <Card className="p-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {uploading ? (
            <div>
              <p className="text-lg font-medium mb-2">Processing form...</p>
              <p className="text-sm text-muted-foreground">
                This may take a few moments
              </p>
            </div>
          ) : isDragActive ? (
            <p className="text-lg font-medium">Drop the PDF here</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                Drag & drop a completed PDF form here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Accepts: Key/Elevator Pass Requests, Major Work Requests, Facility Change Logs, and External Requests
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Form History */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Submissions</h2>
        
        {isLoading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Loading submissions...
          </Card>
        ) : !submissions || submissions.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No forms submitted yet
          </Card>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <Card key={submission.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(submission.processing_status)}
                        <span className="font-medium truncate">
                          {submission.pdf_file_path.split('/').pop()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Type: {submission.form_type.replace('_', ' ')}</span>
                        {submission.confidence_score && (
                          <span>• Confidence: {Math.round(submission.confidence_score * 100)}%</span>
                        )}
                        <span>• {new Date(submission.created_at).toLocaleString()}</span>
                      </div>
                      {submission.error_message && (
                        <p className="text-sm text-destructive mt-1">{submission.error_message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(submission.processing_status)}
                    {submission.processing_status === 'pending' && !submission.linked_request_id && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        Process Form
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Court Reports Section */}
      {courtReports && courtReports.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Extracted Court Reports</h2>
          <div className="space-y-3">
            {courtReports.map((report) => (
              <Card key={report.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium mb-1">
                        {report.location} - {report.report_type}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Date: {new Date(report.report_date).toLocaleDateString()}
                        {' • '}
                        Extracted: {new Date(report.extracted_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCourtReport(report)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedSubmission && (
        <QuickProcessDialog
          submission={selectedSubmission}
          open={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}

      {selectedCourtReport && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Court Report Details</h2>
              <Button variant="ghost" onClick={() => setSelectedCourtReport(null)}>
                Close
              </Button>
            </div>
            <div className="p-4">
              <CourtReportPreview reportData={selectedCourtReport} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
