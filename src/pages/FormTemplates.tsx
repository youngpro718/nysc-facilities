import { FileText, Download, ClipboardList, Wrench, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const formTemplates = [
  {
    id: 'key-request',
    title: 'Key Request Form',
    description: 'Request new keys, spare keys, or key replacements',
    icon: FileText,
    color: 'text-blue-500',
    fields: [
      'Request Type (New/Spare/Replacement)',
      'Room Number',
      'Reason for Request',
      'Quantity',
      'Urgency Level',
      'Requestor Information',
    ],
  },
  {
    id: 'supply-request',
    title: 'Supply Request Form',
    description: 'Request office supplies, equipment, or materials',
    icon: ClipboardList,
    color: 'text-green-500',
    fields: [
      'Request Title',
      'Items List with Quantities',
      'Justification',
      'Priority Level',
      'Department/Location',
      'Requestor Information',
    ],
  },
  {
    id: 'maintenance-request',
    title: 'Maintenance Request Form',
    description: 'Report maintenance issues or request repairs',
    icon: Wrench,
    color: 'text-orange-500',
    fields: [
      'Request Title',
      'Detailed Description',
      'Work Type',
      'Room/Location Number',
      'Priority Level',
      'Requestor Information',
    ],
  },
  {
    id: 'issue-report',
    title: 'Issue Report Form',
    description: 'Report general issues, concerns, or observations',
    icon: AlertCircle,
    color: 'text-red-500',
    fields: [
      'Issue Type',
      'Detailed Description',
      'Location Description',
      'Severity Level',
      'Date/Time Observed',
      'Reporter Information',
    ],
  },
];

export default function FormTemplates() {
  const handleDownload = (templateId: string, templateTitle: string) => {
    // For now, show a message that PDF generation is coming
    toast.info('PDF template generation coming soon. For now, use the digital form intake system.');
    
    // TODO: Implement PDF generation
    // This will be implemented in Phase 3 using the pdfmake library
    console.log('Downloading template:', templateId);
  };

  const handleCreateDigitally = (templateId: string) => {
    // Navigate to form intake
    window.location.href = '/form-intake';
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Form Templates</h1>
        <p className="text-muted-foreground">
          Download blank forms to fill out, or use our digital submission system
        </p>
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

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDownload(template.id, template.title)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleCreateDigitally(template.id)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Submit Online
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
          <CardTitle>How to Use Forms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Option 1: Online Submission (Recommended)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Click "Submit Online" on any form above</li>
              <li>Upload a completed PDF or create a request directly in the system</li>
              <li>Review the auto-extracted information</li>
              <li>Submit for processing</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Option 2: PDF Download & Upload</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Download the PDF template for your request type</li>
              <li>Fill it out completely (digitally or print and handwrite)</li>
              <li>Upload the completed form to the Form Intake page</li>
              <li>AI will automatically extract and route your request</li>
            </ol>
          </div>

          <div className="bg-primary/10 p-3 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> All submitted forms are automatically processed using AI to extract 
              information and route to the appropriate department. You'll receive updates on your request status.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
