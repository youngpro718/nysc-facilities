// Form Templates — downloadable and online facility forms
import { FileText, Download, ClipboardList, Wrench, AlertCircle, Eye, Mail, QrCode, Send, Plus } from 'lucide-react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useState } from 'react';
import { FormPreviewDialog } from '@/components/forms/FormPreviewDialog';
import { PDFGenerationService } from '@/services/forms/pdfGenerationService';
import { useFacilityEmail } from '@/hooks/useFacilityEmail';
import { EmailFormDialog } from '@/components/forms/EmailFormDialog';
import { QRCodeGenerator } from '@/components/forms/QRCodeGenerator';
import { useRolePermissions } from '@/hooks/useRolePermissions';

const formTemplates = [
  {
    id: 'key-request',
    title: 'Key & Elevator Pass Request',
    description: 'Request secure access keys or elevator passes',
    icon: FileText,
    color: 'text-blue-500',
    interactiveForm: '/forms/key-request',
    fields: [
      'Requestor Name',
      'Department',
      'Room Number (for keys)',
      'Quantity Needed',
      'Request Type',
      'Reason for Access',
    ],
  },
  {
    id: 'issue-report',
    title: 'Issue Report',
    description: 'Report facility issues and problems',
    icon: AlertCircle,
    color: 'text-red-500',
    interactiveForm: '/forms/issue-report',
    fields: [
      'Issue Title',
      'Description',
      'Location/Room',
      'Priority Level',
      'Contact Information',
    ],
  },
  {
    id: 'maintenance-request',
    title: 'Maintenance Request',
    description: 'Request facility maintenance and repairs',
    icon: Wrench,
    color: 'text-orange-500',
    interactiveForm: '/forms/maintenance-request',
    fields: [
      'Request Type',
      'Description',
      'Location/Room',
      'Priority',
      'Preferred Date',
      'Contact Information',
    ],
  },
  {
    id: 'supply-request',
    title: 'Supply Request',
    description: 'Request office supplies and materials',
    icon: ClipboardList,
    color: 'text-green-500',
    interactiveForm: '/request/supplies',
    fields: [
      'Items Needed',
      'Quantities',
      'Department',
      'Delivery Location',
      'Urgency',
      'Justification',
    ],
  },
  {
    id: 'painting-request',
    title: 'Room Painting Request',
    description: 'Request to have your room painted - Benjamin Moore colors',
    icon: Wrench,
    color: 'text-purple-500',
    interactiveForm: '/forms/maintenance-request',
    fields: [
      'Request Title',
      'Work Type (Painting)',
      'Room Number',
      'Detailed Description',
      'Paint Colors & Preferences',
      'Priority Level',
    ],
  },
  {
    id: 'flooring-request',
    title: 'Flooring Request',
    description: 'Request carpet or VCT tile flooring installation',
    icon: ClipboardList,
    color: 'text-indigo-500',
    interactiveForm: '/forms/maintenance-request',
    fields: [
      'Request Title',
      'Work Type (Carpentry/General)',
      'Room Number',
      'Flooring Type Needed',
      'Color/Style Preference',
      'Justification',
    ],
  },
];

export default function FormTemplates() {
  const { isAdmin } = useRolePermissions();
  const [previewFormType, setPreviewFormType] = useState<'elevator-pass-request' | 'key-request' | 'supply-request' | 'maintenance-request' | 'issue-report' | 'painting-request' | 'flooring-request' | 'lock-doorknob-request' | 'room-modification-request' | 'major-work-request' | 'facility-change-log' | 'external-request' | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const { email: facilityEmail } = useFacilityEmail();

  const handleDownload = (templateId: string, templateTitle: string) => {
    try {
      PDFGenerationService.downloadForm(templateId);
      toast.success('Form downloaded!', {
        description: 'Fill it out and submit via email or Form Intake.',
      });
    } catch (error) {
      logger.error('Error generating PDF:', error);
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
      'supply-request': '/request/supplies',
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
          <h1 className="text-xl sm:text-3xl font-bold mb-2">Form Templates</h1>
          <p className="text-muted-foreground">
            Fill out forms online instantly or download PDFs - All submissions are tracked in the system
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => window.location.href = '/admin/form-templates'}>
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Template
            </Button>
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
                  {template.interactiveForm ? (
                    <>
                      {/* Primary Action: Fill Out Online */}
                      <Button
                        className="w-full"
                        onClick={() => window.location.href = template.interactiveForm!}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Fill Out Online (Recommended)
                      </Button>
                      
                      {/* Email Form Link Button */}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const formLink = `${window.location.origin}${template.interactiveForm}`;
                          const subject = encodeURIComponent(`NYSC Facilities: ${template.title}`);
                          const body = encodeURIComponent(
                            `Hello,\n\n` +
                            `You've been sent a form to complete for NYSC Facilities.\n\n` +
                            `📋 Form: ${template.title}\n\n` +
                            `🔗 Click here to fill out the form online:\n${formLink}\n\n` +
                            `✨ Benefits of the online form:\n` +
                            `• No download required - fill it out directly in your browser\n` +
                            `• Mobile-friendly and easy to use\n` +
                            `• Instant submission - no need to email back\n` +
                            `• Automatic tracking in our system\n` +
                            `• You'll receive email updates on your request\n\n` +
                            `The form takes just a few minutes to complete and will be immediately processed by our team.\n\n` +
                            `Best regards,\n` +
                            `NYSC Facilities Team`
                          );
                          window.location.href = `mailto:?subject=${subject}&body=${body}`;
                        }}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email Form Link to Someone
                      </Button>

                      {/* Secondary Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(template.id as any)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(template.id, template.title)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                      
                      <div className="bg-green-50 dark:bg-green-950/30 dark:bg-green-950 p-2 rounded text-xs text-green-700 dark:text-green-400 dark:text-green-300 text-center">
                        ✨ Online form submits instantly - no email needed!
                      </div>
                    </>
                  ) : (
                    <>
                      {/* PDF-only forms */}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handlePreview((template.id as any))}
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
                          window.location.href = `mailto:${facilityEmail}?subject=${subject}&body=${body}`;
                        }}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email Completed Form
                      </Button>
                    </>
                  )}
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
          <div className="bg-blue-50 dark:bg-blue-950/30 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Forms are an alternative way to submit requests</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              All form submissions are logged and tracked in the app system, just like direct app submissions. 
              Use forms if you prefer paper/email or need to document major facility work.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">What You Can Request:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Elevator Pass:</strong> Simple request - one per person (name & department only)</li>
              <li>• <strong>Keys:</strong> Room keys - spare, replacement, or key issues</li>
              <li>• <strong>Painting:</strong> Room painting with Benjamin Moore color selection</li>
              <li>• <strong>Flooring:</strong> Carpet or VCT tile installation</li>
              <li>• <strong>Lock/Doorknob:</strong> Lock changes, doorknob repairs, key changes</li>
              <li>• <strong>Room Modifications:</strong> Track any physical changes to room structure</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">How to Submit (Recommended):</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li><strong>Fill Out Online:</strong> Click "Fill Out Online (Recommended)" for instant submission</li>
              <li><strong>Complete Form:</strong> Fill in all required fields directly in your browser</li>
              <li><strong>Submit:</strong> Click submit - your request is instantly logged in the system</li>
              <li><strong>Track:</strong> You'll receive email updates as your request is processed</li>
            </ol>
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/30 dark:bg-green-950 rounded text-xs text-green-700 dark:text-green-400 dark:text-green-300">
              ✨ <strong>Benefits:</strong> No downloads, no email attachments, instant submission, mobile-friendly!
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Alternative: PDF Forms</h4>
            <p className="text-sm text-muted-foreground mb-2">
              If you prefer paper forms or need to document offline:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Click "PDF" to download a blank form</li>
              <li>Fill it out (digitally or print & handwrite)</li>
              <li>Email it to {facilityEmail} or upload via Form Intake</li>
            </ol>
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
