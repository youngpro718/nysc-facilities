import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FormReviewDialog } from '@/components/forms/FormReviewDialog';

export default function FormIntake() {
  const [uploading, setUploading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
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

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('form-pdfs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create submission record
      const { data: submission, error: submissionError } = await supabase
        .from('form_submissions')
        .insert({
          pdf_file_path: fileName,
          form_type: 'unknown',
          uploaded_by: user.id,
          processing_status: 'pending',
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      toast.success('Form uploaded! Processing...');

      // Call edge function to parse
      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-form-pdf', {
        body: {
          filePath: fileName,
          submissionId: submission.id,
        },
      });

      if (parseError) {
        toast.error('Failed to parse form: ' + parseError.message);
      } else {
        toast.success(`Form identified as: ${parseResult.formType}`);
        queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload form');
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
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'needs_review':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'default',
      failed: 'destructive',
      processing: 'secondary',
      needs_review: 'outline',
      pending: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Form Intake System</h1>
        <p className="text-muted-foreground">
          Upload completed PDF forms for automatic processing
        </p>
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
                Drag & drop a PDF form here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Supports Key Requests, Supply Requests, Maintenance Work Orders, and Issue Reports
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
                    {submission.processing_status === 'completed' && !submission.linked_request_id && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        Review & Submit
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedSubmission && (
        <FormReviewDialog
          submission={selectedSubmission}
          open={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
}
