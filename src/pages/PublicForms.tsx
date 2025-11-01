import { useState } from 'react';
import { FileText, Download, ClipboardList, Wrench, AlertCircle, Eye, Mail, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FormPreviewDialog } from '@/components/forms/FormPreviewDialog';
import { PDFGenerationService } from '@/services/forms/pdfGenerationService';
import { useFacilityEmail } from '@/hooks/useFacilityEmail';

const formTemplates = [
  {
    id: 'key-request',
    title: 'Key & Elevator Pass Request',
    description: 'Request secure access keys or elevator passes',
    icon: FileText,
    color: 'text-blue-500',
  },
  {
    id: 'major-work-request',
    title: 'Major Work Request Form',
    description: 'For significant facility changes - new outlets, flooring, painting',
    icon: Wrench,
    color: 'text-orange-500',
  },
  {
    id: 'facility-change-log',
    title: 'Facility Change Log Form',
    description: 'Document major facility modifications and improvements',
    icon: ClipboardList,
    color: 'text-green-500',
  },
  {
    id: 'external-request',
    title: 'General Request Form',
    description: 'For any facility-related request',
    icon: AlertCircle,
    color: 'text-purple-500',
  },
];

export default function PublicForms() {
  const [previewFormType, setPreviewFormType] = useState<'key-request' | 'supply-request' | 'maintenance-request' | 'issue-report' | null>(null);
  const { email: facilityEmail } = useFacilityEmail();

  const handleDownload = (templateId: string, templateTitle: string) => {
    try {
      PDFGenerationService.downloadForm(templateId);
      toast.success('Form downloaded!', {
        description: 'Fill it out and submit via email or upload.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', {
        description: 'Please try again or contact support.',
      });
    }
  };

  const handlePreview = (templateId: 'key-request' | 'supply-request' | 'maintenance-request' | 'issue-report') => {
    setPreviewFormType(templateId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">NYSC Facilities - Public Forms</h1>
          <p className="text-lg opacity-90">
            No login required - Download forms and submit requests
          </p>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Important Notice */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Public Access - No Account Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This page is for people without app access. Download forms, fill them out, and submit via email or upload. 
              All submissions are tracked in the NYSC Facilities system.
            </p>
          </CardContent>
        </Card>

        {/* Form Templates */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Available Forms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg bg-muted`}>
                        <Icon className={`w-6 h-6 ${template.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{template.title}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePreview(template.id as any)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        onClick={() => handleDownload(template.id, template.title)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                    <Badge variant="secondary" className="text-xs w-full justify-center">
                      Tracked in system
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Submission Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Submit Your Completed Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Email Submission */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="font-semibold">Option 1: Email</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Email your completed form to:
                </p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-mono text-sm font-semibold">{facilityEmail}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const subject = encodeURIComponent('Completed Form Submission');
                    const body = encodeURIComponent(
                      'Hello,\n\nPlease find my completed form attached.\n\nThis submission should be tracked in the NYSC Facilities system.\n\nThank you!'
                    );
                    window.location.href = `mailto:${facilityEmail}?subject=${subject}&body=${body}`;
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Open Email
                </Button>
              </div>

              {/* Upload Submission */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Upload className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold">Option 2: Upload</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload your completed PDF form online:
                </p>
                <Button
                  className="w-full"
                  onClick={() => window.location.href = '/submit-form'}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Form
                </Button>
                <p className="text-xs text-muted-foreground">
                  No login required. AI will process your submission.
                </p>
              </div>

              {/* In-Person Submission */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="font-semibold">Option 3: In Person</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bring your completed form to:
                </p>
                <div className="bg-muted p-3 rounded-lg space-y-1">
                  <p className="text-sm font-semibold">Facilities Office</p>
                  <p className="text-xs text-muted-foreground">Room 100, Main Building</p>
                  <p className="text-xs text-muted-foreground">Mon-Fri, 9AM-5PM</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm">
                <strong>All submissions are tracked:</strong> Whether you email, upload, or submit in person, 
                your request will be logged in the NYSC Facilities system and you'll receive updates.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Do I need an account to submit a form?</h4>
              <p className="text-sm text-muted-foreground">
                No! This page is specifically for people without app access. Just download, fill out, and submit.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">How will I know if my request was received?</h4>
              <p className="text-sm text-muted-foreground">
                You'll receive an email confirmation once your form is processed. Include your email on the form.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Can I fill out the form digitally?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! The PDF can be filled out using Adobe Reader or similar PDF software, or you can print and handwrite.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What if I have app access?</h4>
              <p className="text-sm text-muted-foreground">
                If you have an account, it's faster to use the app directly. Log in and use the Keys, Operations, or Issues pages.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Preview Dialog */}
      {previewFormType && (
        <FormPreviewDialog
          open={!!previewFormType}
          onClose={() => setPreviewFormType(null)}
          formType={previewFormType}
        />
      )}
    </div>
  );
}
