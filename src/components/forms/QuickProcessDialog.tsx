import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { 
  createKeyRequestFromForm,
  createSupplyRequestFromForm,
  createMaintenanceRequestFromForm,
  createIssueFromForm 
} from '@/services/forms/formSubmissionService';

interface QuickProcessDialogProps {
  submission: any;
  open: boolean;
  onClose: () => void;
}

export function QuickProcessDialog({ submission, open, onClose }: QuickProcessDialogProps) {
  const [formType, setFormType] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const formTypes = [
    { value: 'key_request', label: 'Key & Elevator Pass Request' },
    { value: 'major_work', label: 'Major Work Request' },
    { value: 'facility_change', label: 'Facility Change Log' },
    { value: 'general_request', label: 'General Request' },
  ];

  const handleSubmit = async () => {
    if (!formType || !contactName || !contactEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Prepare form data based on type
      const baseData = {
        requestor_name: contactName,
        requestor_email: contactEmail,
        requestor_phone: contactPhone,
        notes: notes,
        pdf_reference: submission.pdf_file_path,
      };

      let result;
      switch (formType) {
        case 'key_request':
          result = await createKeyRequestFromForm({
            ...baseData,
            request_type: 'new',
            reason: notes || 'Submitted via email form',
            quantity: 1,
          }, user.id, submission.id);
          break;

        case 'major_work':
          result = await createMaintenanceRequestFromForm({
            ...baseData,
            title: 'Major Work Request',
            description: notes || 'Submitted via email form',
            priority: 'medium',
            work_type: 'general',
          }, user.id, submission.id);
          break;

        case 'facility_change':
          result = await createIssueFromForm({
            ...baseData,
            title: 'Facility Change Log',
            description: notes || 'Submitted via email form',
            issue_type: 'facility_change',
            priority: 'medium',
            location_description: 'See attached PDF',
          }, user.id, submission.id);
          break;

        case 'general_request':
          result = await createIssueFromForm({
            ...baseData,
            title: 'General Request',
            description: notes || 'Submitted via email form',
            issue_type: 'general',
            priority: 'medium',
            location_description: 'See attached PDF',
          }, user.id, submission.id);
          break;

        default:
          throw new Error('Invalid form type');
      }

      if (result.success) {
        // Update submission status
        await supabase
          .from('form_submissions')
          .update({
            processing_status: 'processed',
            form_type: formType,
            extracted_data: {
              ...submission.extracted_data,
              processed_by: user.id,
              processed_at: new Date().toISOString(),
              contact_name: contactName,
              contact_email: contactEmail,
              contact_phone: contactPhone,
            },
          })
          .eq('id', submission.id);

        toast.success('Form processed successfully!', {
          description: 'Request created and tracked in the system.',
        });

        queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
        onClose();

        // Reset form
        setFormType('');
        setContactName('');
        setContactEmail('');
        setContactPhone('');
        setNotes('');
      } else {
        throw new Error(result.error || 'Failed to create request');
      }
    } catch (error: any) {
      console.error('Processing error:', error);
      toast.error(error.message || 'Failed to process form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Process Form Submission
          </DialogTitle>
          <DialogDescription>
            Enter the details from the PDF to create the request in the system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* PDF Reference */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">PDF File:</p>
            <p className="text-xs text-muted-foreground">{submission.pdf_file_path.split('/').pop()}</p>
          </div>

          {/* Form Type */}
          <div className="space-y-2">
            <Label htmlFor="formType">
              Form Type <span className="text-destructive">*</span>
            </Label>
            <Select value={formType} onValueChange={setFormType}>
              <SelectTrigger id="formType">
                <SelectValue placeholder="Select the type of form" />
              </SelectTrigger>
              <SelectContent>
                {formTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-semibold text-sm">Contact Information (from PDF)</h4>
            
            <div className="space-y-2">
              <Label htmlFor="contactName">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactName"
                placeholder="John Doe"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="john.doe@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone (optional)</Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="(555) 123-4567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details from the PDF..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Quick Process:</strong> Select the form type, enter the contact info from the PDF, 
              and click Create Request. The PDF will be attached as a reference.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !formType || !contactName || !contactEmail}>
            {submitting ? 'Creating...' : 'Create Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
