import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, ClipboardList, Wrench, AlertCircle } from 'lucide-react';

interface FormPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  formType: 'key-request' | 'supply-request' | 'maintenance-request' | 'issue-report' | 'major-work-request' | 'facility-change-log' | 'external-request';
}

const formConfigs = {
  'key-request': {
    title: 'Key Request Form',
    icon: FileText,
    color: 'text-blue-500',
    fields: [
      { name: 'requestType', label: 'Request Type', type: 'select', options: ['New Key', 'Spare Key', 'Replacement Key'] },
      { name: 'roomNumber', label: 'Room Number', type: 'text', placeholder: 'e.g., 1000, 1324A' },
      { name: 'reason', label: 'Reason for Request', type: 'textarea', placeholder: 'Explain why you need this key...' },
      { name: 'quantity', label: 'Quantity', type: 'number', placeholder: '1' },
      { name: 'urgency', label: 'Urgency Level', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'] },
      { name: 'requestorName', label: 'Your Name', type: 'text', placeholder: 'Full name' },
      { name: 'requestorEmail', label: 'Email', type: 'email', placeholder: 'your.email@example.com' },
      { name: 'requestorPhone', label: 'Phone', type: 'tel', placeholder: '(555) 123-4567' },
    ],
  },
  'supply-request': {
    title: 'Supply Request Form',
    icon: ClipboardList,
    color: 'text-green-500',
    fields: [
      { name: 'title', label: 'Request Title', type: 'text', placeholder: 'Brief description of supplies needed' },
      { name: 'items', label: 'Items List', type: 'textarea', placeholder: 'List items with quantities:\n- Item 1: 5 units\n- Item 2: 10 units' },
      { name: 'justification', label: 'Justification', type: 'textarea', placeholder: 'Explain why these supplies are needed...' },
      { name: 'priority', label: 'Priority Level', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'department', label: 'Department/Location', type: 'text', placeholder: 'Your department or office location' },
      { name: 'requestorName', label: 'Your Name', type: 'text', placeholder: 'Full name' },
      { name: 'requestorEmail', label: 'Email', type: 'email', placeholder: 'your.email@example.com' },
    ],
  },
  'maintenance-request': {
    title: 'Maintenance Request Form',
    icon: Wrench,
    color: 'text-orange-500',
    fields: [
      { name: 'title', label: 'Request Title', type: 'text', placeholder: 'Brief description of the issue' },
      { name: 'description', label: 'Detailed Description', type: 'textarea', placeholder: 'Provide detailed information about the maintenance needed...' },
      { name: 'workType', label: 'Work Type', type: 'select', options: ['Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Painting', 'General Repair', 'Other'] },
      { name: 'location', label: 'Room/Location Number', type: 'text', placeholder: 'e.g., Room 1000, Hallway 3B' },
      { name: 'priority', label: 'Priority Level', type: 'select', options: ['Low', 'Medium', 'High', 'Emergency'] },
      { name: 'requestorName', label: 'Your Name', type: 'text', placeholder: 'Full name' },
      { name: 'requestorEmail', label: 'Email', type: 'email', placeholder: 'your.email@example.com' },
      { name: 'requestorPhone', label: 'Phone', type: 'tel', placeholder: '(555) 123-4567' },
    ],
  },
  'issue-report': {
    title: 'Issue Report Form',
    icon: AlertCircle,
    color: 'text-red-500',
    fields: [
      { name: 'issueType', label: 'Issue Type', type: 'select', options: ['Safety Concern', 'Security Issue', 'Facility Problem', 'Equipment Malfunction', 'Other'] },
      { name: 'description', label: 'Detailed Description', type: 'textarea', placeholder: 'Describe the issue in detail...' },
      { name: 'location', label: 'Location Description', type: 'text', placeholder: 'Where did you observe this issue?' },
      { name: 'severity', label: 'Severity Level', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'dateTime', label: 'Date/Time Observed', type: 'datetime-local' },
      { name: 'reporterName', label: 'Your Name', type: 'text', placeholder: 'Full name' },
      { name: 'reporterEmail', label: 'Email', type: 'email', placeholder: 'your.email@example.com' },
      { name: 'reporterPhone', label: 'Phone (optional)', type: 'tel', placeholder: '(555) 123-4567' },
    ],
  },
  'major-work-request': {
    title: 'Major Work Request Form',
    icon: Wrench,
    color: 'text-orange-500',
    fields: [
      { name: 'workType', label: 'Work Type', type: 'select', options: ['Electrical', 'Flooring', 'Painting', 'Plumbing', 'HVAC', 'Other'] },
      { name: 'title', label: 'Work Title/Description', type: 'text', placeholder: 'Brief description' },
      { name: 'scope', label: 'Detailed Scope of Work', type: 'textarea', placeholder: 'Detailed description...' },
      { name: 'location', label: 'Room/Location Number', type: 'text', placeholder: 'e.g., Room 1000' },
      { name: 'justification', label: 'Justification for Work', type: 'textarea', placeholder: 'Why is this work needed?' },
      { name: 'budget', label: 'Budget Estimate (if known)', type: 'text', placeholder: 'Optional' },
      { name: 'requestorName', label: 'Your Name', type: 'text', placeholder: 'Full name' },
      { name: 'requestorEmail', label: 'Email', type: 'email', placeholder: 'your.email@example.com' },
      { name: 'requestorPhone', label: 'Phone', type: 'tel', placeholder: '(555) 123-4567' },
    ],
  },
  'facility-change-log': {
    title: 'Facility Change Log Form',
    icon: ClipboardList,
    color: 'text-green-500',
    fields: [
      { name: 'changeDescription', label: 'Change Description', type: 'textarea', placeholder: 'Describe the change...' },
      { name: 'location', label: 'Location Affected', type: 'text', placeholder: 'Where was the change made?' },
      { name: 'dateOfChange', label: 'Date of Change', type: 'date' },
      { name: 'reason', label: 'Reason for Change', type: 'textarea', placeholder: 'Why was this change made?' },
      { name: 'photos', label: 'Before/After Photos', type: 'text', placeholder: 'Attach separately or include links' },
      { name: 'submittedBy', label: 'Submitted By', type: 'text', placeholder: 'Your name' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'your.email@example.com' },
      { name: 'department', label: 'Department', type: 'text', placeholder: 'Your department' },
    ],
  },
  'external-request': {
    title: 'General Request Form',
    icon: AlertCircle,
    color: 'text-purple-500',
    fields: [
      { name: 'requestType', label: 'Request Type/Category', type: 'text', placeholder: 'What type of request?' },
      { name: 'description', label: 'Detailed Description', type: 'textarea', placeholder: 'Describe your request in detail...' },
      { name: 'location', label: 'Location/Room Number', type: 'text', placeholder: 'Where is this related to?' },
      { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'] },
      { name: 'requestorName', label: 'Your Name', type: 'text', placeholder: 'Full name' },
      { name: 'requestorEmail', label: 'Email', type: 'email', placeholder: 'your.email@example.com' },
      { name: 'requestorPhone', label: 'Phone', type: 'tel', placeholder: '(555) 123-4567' },
      { name: 'contactMethod', label: 'Preferred Contact Method', type: 'text', placeholder: 'Email, phone, etc.' },
    ],
  },
};

export function FormPreviewDialog({ open, onClose, formType }: FormPreviewDialogProps) {
  const config = formConfigs[formType];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-lg bg-muted`}>
              <Icon className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <DialogTitle className="text-2xl">{config.title}</DialogTitle>
              <DialogDescription>
                Preview of the form fields users will fill out
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Card className="border-2">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${config.color}`} />
              Form Preview
            </CardTitle>
            <CardDescription>
              This is what users will see when filling out this form
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {config.fields.map((field, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={field.name} className="text-base font-semibold">
                  {field.label}
                  {field.type !== 'tel' || !field.label.includes('optional') ? (
                    <span className="text-destructive ml-1">*</span>
                  ) : null}
                </Label>
                
                {field.type === 'select' && field.options ? (
                  <Select disabled>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    rows={4}
                    disabled
                    className="resize-none"
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled
                  />
                )}
                
                {field.placeholder && field.type !== 'select' && (
                  <p className="text-xs text-muted-foreground">
                    {field.placeholder}
                  </p>
                )}
              </div>
            ))}

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Auto-processed with AI</Badge>
                <Badge variant="outline">Instant routing</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Once submitted, this form will be automatically processed and routed to the appropriate department for handling.
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
