import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Send } from 'lucide-react';
import { PDFGenerationService } from '@/services/forms/pdfGenerationService';

interface EmailFormDialogProps {
  open: boolean;
  onClose: () => void;
}

const formTypes = [
  { id: 'key-request', name: 'Key & Elevator Pass Request' },
  { id: 'major-work-request', name: 'Major Work Request' },
  { id: 'facility-change-log', name: 'Facility Change Log' },
  { id: 'external-request', name: 'General Request Form' },
];

export function EmailFormDialog({ open, onClose }: EmailFormDialogProps) {
  const [formType, setFormType] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!formType || !recipientEmail) {
      toast.error('Please select a form type and enter recipient email');
      return;
    }

    setSending(true);

    try {
      // Generate PDF
      const selectedForm = formTypes.find(f => f.id === formType);
      if (!selectedForm) throw new Error('Invalid form type');

      // Generate the PDF
      PDFGenerationService.downloadForm(formType);

      // Compose email
      const subject = encodeURIComponent(`NYSC Facilities Form: ${selectedForm.name}`);
      const greeting = recipientName ? `Hello ${recipientName},\n\n` : 'Hello,\n\n';
      const customPart = customMessage ? `${customMessage}\n\n` : '';
      const body = encodeURIComponent(
        `${greeting}${customPart}Please find attached the ${selectedForm.name} for NYSC Facilities.\n\n` +
        `Instructions:\n` +
        `1. Fill out all required fields in the PDF\n` +
        `2. Submit your completed form by:\n` +
        `   - Replying to this email with the completed PDF attached, OR\n` +
        `   - Uploading at: ${window.location.origin}/submit-form\n` +
        `   - Emailing to: facilities@nysc.gov\n\n` +
        `Your submission will be tracked in the NYSC Facilities system and you'll receive updates.\n\n` +
        `Need help? Contact us at facilities@nysc.gov or call (555) 123-4567\n\n` +
        `Best regards,\n` +
        `NYSC Facilities Team`
      );

      // Open email client
      window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;

      toast.success('Email composed!', {
        description: 'Please attach the downloaded PDF and send the email.',
      });

      // Reset form
      setFormType('');
      setRecipientEmail('');
      setRecipientName('');
      setCustomMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending form:', error);
      toast.error('Failed to compose email');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Form to Someone
          </DialogTitle>
          <DialogDescription>
            Send a form to someone who doesn't have app access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Form Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="formType">
              Form Type <span className="text-destructive">*</span>
            </Label>
            <Select value={formType} onValueChange={setFormType}>
              <SelectTrigger id="formType">
                <SelectValue placeholder="Select a form to send" />
              </SelectTrigger>
              <SelectContent>
                {formTypes.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">
              Recipient Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          {/* Recipient Name (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
            <Input
              id="recipientName"
              placeholder="John Doe"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          {/* Custom Message (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="customMessage">Custom Message (Optional)</Label>
            <Textarea
              id="customMessage"
              placeholder="Add a personal message to include in the email..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Preview */}
          {formType && recipientEmail && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-semibold">Email Preview:</p>
              <div className="text-xs space-y-1">
                <p><strong>To:</strong> {recipientEmail}</p>
                <p><strong>Subject:</strong> NYSC Facilities Form: {formTypes.find(f => f.id === formType)?.name}</p>
                <p><strong>Attachment:</strong> {formTypes.find(f => f.id === formType)?.name}.pdf</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !formType || !recipientEmail}>
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Composing...' : 'Compose Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
