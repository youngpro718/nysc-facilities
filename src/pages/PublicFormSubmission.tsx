import { useState } from 'react';
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, ArrowLeft, Mail, Phone, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useFacilityEmail } from '@/hooks/useFacilityEmail';

export default function PublicFormSubmission() {
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { email: facilityEmail } = useFacilityEmail();
  
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const uploadedFile = acceptedFiles[0];
    if (uploadedFile.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (uploadedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setFile(uploadedFile);
    toast.success('File selected', {
      description: uploadedFile.name,
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: uploading || submitted,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    if (!contactInfo.name || !contactInfo.email) {
      toast.error('Please provide your name and email');
      return;
    }

    setUploading(true);

    try {
      // Generate tracking code
      const code = `PUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Upload to storage
      const fileName = `public/${code}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('form-pdfs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create submission record
      const { error: submissionError } = await supabase
        .from('form_submissions')
        .insert({
          pdf_file_path: fileName,
          form_type: 'unknown',
          uploaded_by: null, // Public submission, no user ID
          processing_status: 'processing',
          extracted_data: {
            public_submission: true,
            contact_name: contactInfo.name,
            contact_email: contactInfo.email,
            contact_phone: contactInfo.phone,
            tracking_code: code,
          },
        });

      if (submissionError) throw submissionError;

      setTrackingCode(code);
      setSubmitted(true);
      
      toast.success('Form submitted successfully!', {
        description: 'You will receive an email confirmation shortly.',
      });

      // TODO: Send confirmation email to contactInfo.email
    } catch (error) {
      logger.error('Upload error:', error);
      toast.error('Failed to submit form', {
        description: getErrorMessage(error) || `Please try again or email the form to ${facilityEmail}`,
      });
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Form Submitted Successfully!</CardTitle>
            <CardDescription>
              Your request has been received and will be processed shortly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-semibold">Your Tracking Code:</p>
              <p className="text-2xl font-mono font-bold text-primary">{trackingCode}</p>
              <p className="text-xs text-muted-foreground">
                Save this code to track your submission
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">What Happens Next?</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>You'll receive an email confirmation at {contactInfo.email}</li>
                <li>Our AI will process and extract information from your form</li>
                <li>Your request will be routed to the appropriate department</li>
                <li>You'll receive updates via email as your request is processed</li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Need help?</strong> Contact us at {facilityEmail} or call (555) 123-4567
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.location.href = '/public-forms'}
              >
                Submit Another Form
              </Button>
              <Button
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="mb-4 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => window.location.href = '/public-forms'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forms
          </Button>
          <h1 className="text-4xl font-bold mb-2">Submit Your Form</h1>
          <p className="text-lg opacity-90">
            No login required - Upload your completed PDF
          </p>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Your Contact Information</CardTitle>
              <CardDescription>
                We'll use this to send you updates about your request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Completed Form</CardTitle>
              <CardDescription>
                Upload the PDF form you filled out
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                {file ? (
                  <div>
                    <p className="text-lg font-medium mb-2">
                      <FileText className="inline w-5 h-5 mr-2" />
                      {file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click to change file
                    </p>
                  </div>
                ) : isDragActive ? (
                  <p className="text-lg font-medium">Drop the PDF here</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium mb-2">
                      Drag & drop your completed PDF here, or click to select
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Maximum file size: 5MB
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = '/public-forms'}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || !file}
              className="flex-1"
            >
              {uploading ? 'Submitting...' : 'Submit Form'}
            </Button>
          </div>

          {/* Help Text */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Need help?</strong> If you're having trouble uploading, you can also email your completed form to{' '}
                <a href={`mailto:${facilityEmail}`} className="text-primary hover:underline">
                  {facilityEmail}
                </a>
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
