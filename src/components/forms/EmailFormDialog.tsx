import { useState } from 'react';
import { logger } from '@/lib/logger';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Send } from 'lucide-react';
import { getFacilityEmail } from '@/services/emailConfigService';

interface EmailFormDialogProps {
  open: boolean;
  onClose: () => void;
}

const formTypes = [
  { id: 'key-request', name: 'Key & Elevator Pass Request', path: '/forms/key-request' },
  { id: 'issue-report', name: 'Issue Report', path: '/forms/issue-report' },
  { id: 'maintenance-request', name: 'Maintenance Request', path: '/forms/maintenance-request' },
  { id: 'supply-request', name: 'Supply Request', path: '/request/supplies' },
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
      const selectedForm = formTypes.find(f => f.id === formType);
      if (!selectedForm) throw new Error('Invalid form type');

      // Get facility email
      const facilityEmail = await getFacilityEmail();

      // Create the form link
      const formLink = `${window.location.origin}${selectedForm.path}`;

      // Compose email with link to interactive form
      const subject = encodeURIComponent(`NYSC Facilities: ${selectedForm.name}`);
      const greeting = recipientName ? `Hello ${recipientName},\n\n` : 'Hello,\n\n';
      const customPart = customMessage ? `${customMessage}\n\n` : '';
      const body = encodeURIComponent(
        `${greeting}${customPart}You've been sent a form to complete for NYSC Facilities.\n\n` +
        `📋 Form: ${selectedForm.name}\n\n` +
        `🔗 Click here to fill out the form online:\n${formLink}\n\n` +
        `✨ Benefits of the online form:\n` +
        `• No download required - fill it out directly in your browser\n` +
        `• Mobile-friendly and easy to use\n` +
        `• Instant submission - no need to email back\n` +
        `• Automatic tracking in our system\n` +
        `• You'll receive email updates on your request\n\n` +
        `The form takes just a few minutes to complete and will be immediately processed by our team.\n\n` +
        `Need help? Contact us at ${facilityEmail} or call (555) 123-4567\n\n` +
        `Best regards,\n` +
        `NYSC Facilities Team`
      );

      // Open email client
      window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;

      toast.success('Email composed!', {
        description: 'Send the email to share the interactive form link.',
      });

      // Reset form
      setFormType('');
      setRecipientEmail('');
      setRecipientName('');
      setCustomMessage('');
      onClose();
    } catch (error) {
      logger.error('Error composing email:', error);
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
            Email Interactive Form Link
          </DialogTitle>
          <DialogDescription>
            Send a link to an online form that can be filled out and submitted instantly
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
                <p><strong>Subject:</strong> NYSC Facilities: {formTypes.find(f => f.id === formType)?.name}</p>
                <p><strong>Contains:</strong> Interactive form link - {window.location.origin}{formTypes.find(f => f.id === formType)?.path}</p>
                <p className="text-muted-foreground italic">Recipient can fill out and submit the form online instantly</p>
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
