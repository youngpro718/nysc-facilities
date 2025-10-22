import { FileText, Download, ClipboardList, Wrench, AlertCircle, Eye, Mail, QrCode, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useState } from 'react';
import { FormPreviewDialog } from '@/components/forms/FormPreviewDialog';
import { PDFGenerationService } from '@/services/forms/pdfGenerationService';
import { EmailFormDialog } from '@/components/forms/EmailFormDialog';
import { QRCodeGenerator } from '@/components/forms/QRCodeGenerator';
import { useRolePermissions } from '@/hooks/useRolePermissions';

const formTemplates = [
  {
    id: 'key-request',
    title: 'Key & Elevator Pass Request',
    description: 'Request secure access keys or elevator passes - tracked in the system',
    icon: FileText,
    color: 'text-blue-500',
    fields: [
      'Request Type (Key/Elevator Pass)',
      'Room Number or Elevator Access',
      'Reason for Access',
      'Quantity',
      'Requestor Information',
      'Contact Details',
    ],
  },
  {
    id: 'major-work-request',
    title: 'Major Work Request Form',
    description: 'For significant facility changes - new outlets, flooring, painting offices',
    icon: Wrench,
    color: 'text-orange-500',
    fields: [
      'Work Type (Electrical/Flooring/Painting/Other)',
      'Detailed Scope of Work',
      'Room/Location Number',
      'Justification for Work',
      'Budget Estimate (if known)',
      'Requestor Information',
    ],
  },
  {
    id: 'facility-change-log',
    title: 'Facility Change Log Form',
    description: 'Document major facility modifications and improvements',
    icon: ClipboardList,
    color: 'text-green-500',
    fields: [
      'Change Description',
      'Location Affected',
      'Date of Change',
      'Reason for Change',
      'Before/After Photos (optional)',
      'Submitted By',
    ],
  },
  {
    id: 'external-request',
    title: 'External Request Form',
    description: 'For people without system access to submit any facility-related request',
    icon: AlertCircle,
    color: 'text-purple-500',
    fields: [
      'Request Type',
      'Detailed Description',
      'Location/Room Number',
      'Contact Information',
      'Preferred Contact Method',
      'Urgency Level',
    ],
  },
];

export default function FormTemplates() {
  const { isAdmin } = useRolePermissions();
  const [previewFormType, setPreviewFormType] = useState<'key-request' | 'supply-request' | 'maintenance-request' | 'issue-report' | 'major-work-request' | 'facility-change-log' | 'external-request' | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const handleDownload = (templateId: string, templateTitle: string) => {
    try {
      PDFGenerationService.downloadForm(templateId);
      toast.success('Form downloaded!', {
        description: 'Fill it out and submit via email or Form Intake.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', {
        description: 'Please try again or contact support.',
      });
    }
  };

  const handleEmailForm = (templateTitle: string) => {
    const subject = encodeURIComponent(`Request for ${templateTitle}`);
    const body = encodeURIComponent(
      `Hello,\n\nI would like to request a blank ${templateTitle}.\n\nPlease send it to this email address.\n\nThank you!`
    );
    window.location.href = `mailto:facilities@nysc.gov?subject=${subject}&body=${body}`;
  };

  const handleCreateDigitally = (templateId: string) => {
    // Navigate to specific form page
    const formRoutes: Record<string, string> = {
      'key-request': '/forms/key-request',
      'supply-request': '/forms/supply-request',
      'maintenance-request': '/forms/maintenance-request',
      'issue-report': '/forms/issue-report',
    };
    
    const route = formRoutes[templateId];
    if (route) {
      window.location.href = route;
    } else {
      // Fallback to form intake
      window.location.href = '/form-intake';
    }
  };

  const handlePreview = (templateId: 'key-request' | 'supply-request' | 'maintenance-request' | 'issue-report' | 'major-work-request' | 'facility-change-log' | 'external-request') => {
    setPreviewFormType(templateId);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Form Templates</h1>
          <p className="text-muted-foreground">
            Alternative way to submit requests - All submissions are tracked in the app system
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEmailDialogOpen(true)}>
              <Send className="w-4 h-4 mr-2" />
              Email Form
            </Button>
            <Button variant="outline" onClick={() => setQrDialogOpen(true)}>
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-muted`}>
                      <Icon className={`w-6 h-6 ${template.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{template.title}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Required Fields:</h4>
                  <ul className="space-y-1">
                    {template.fields.map((field, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{field}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handlePreview(template.id as any)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Form
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(template.id, template.title)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/form-intake'}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Upload Form
                    </Button>
                  </div>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      const subject = encodeURIComponent(`Completed ${template.title}`);
                      const body = encodeURIComponent(
                        `Hello,\n\nPlease find my completed ${template.title} attached.\n\nThis submission should be tracked in the NYSC Facilities system.\n\nThank you!`
                      );
                      window.location.href = `mailto:facilities@nysc.gov?subject=${subject}&body=${body}`;
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Completed Form
                  </Button>
                </div>

                <div className="pt-2 border-t">
                  <Badge variant="secondary" className="text-xs">
                    Auto-processed with AI
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instructions Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>How Forms Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Forms are an alternative way to submit requests</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              All form submissions are logged and tracked in the app system, just like direct app submissions. 
              Use forms if you prefer paper/email or need to document major facility work.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">What You Can Request:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Keys & Elevator Passes:</strong> Secure access requests (same as Keys page)</li>
              <li>• <strong>Major Work:</strong> Significant facility changes - new outlets, flooring, painting</li>
              <li>• <strong>Facility Changes:</strong> Document and log major modifications</li>
              <li>• <strong>General Requests:</strong> Any facility-related need</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">How to Submit:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li><strong>Download PDF:</strong> Click "Download PDF" to get a blank form</li>
              <li><strong>Fill Out:</strong> Complete all required fields (digitally or print & handwrite)</li>
              <li><strong>Submit:</strong> Click "Email Completed Form" to send it, or use "Upload Form" for Form Intake</li>
              <li><strong>Track:</strong> Your request is logged in the system and you'll receive updates</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Alternative: Use the App Directly</h4>
            <p className="text-sm text-muted-foreground mb-2">
              For faster processing, you can also use the app's built-in features:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• <strong>Keys Page:</strong> Quick key and elevator pass requests</li>
              <li>• <strong>Operations:</strong> Maintenance and facility work</li>
              <li>• <strong>Issues:</strong> Report problems directly</li>
            </ul>
          </div>

          <div className="bg-primary/10 p-3 rounded-lg">
            <p className="text-sm">
              <strong>Everything is tracked:</strong> Whether you submit via form or directly in the app, 
              all requests are logged in the same system for complete tracking and accountability.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form Preview Dialog */}
      {previewFormType && (
        <FormPreviewDialog
          open={!!previewFormType}
          onClose={() => setPreviewFormType(null)}
          formType={previewFormType}
        />
      )}

      {/* Email Form Dialog */}
      <EmailFormDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
      />

      {/* QR Code Generator */}
      <QRCodeGenerator
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
      />
    </div>
  );
}
