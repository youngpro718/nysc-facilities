import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { 
  createKeyRequestFromForm,
  createSupplyRequestFromForm,
  createMaintenanceRequestFromForm,
  createIssueFromForm 
} from '@/services/forms/formSubmissionService';

interface FormReviewDialogProps {
  submission: any;
  open: boolean;
  onClose: () => void;
}

export function FormReviewDialog({ submission, open, onClose }: FormReviewDialogProps) {
  const [formData, setFormData] = useState(submission.extracted_data || {});
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let result;
      switch (submission.form_type) {
        case 'key_request':
          result = await createKeyRequestFromForm(formData, user.id, submission.id);
          break;
        case 'supply_request':
          result = await createSupplyRequestFromForm(formData, user.id, submission.id);
          break;
        case 'maintenance_request':
          result = await createMaintenanceRequestFromForm(formData, user.id, submission.id);
          break;
        case 'issue_report':
          result = await createIssueFromForm(formData, user.id, submission.id);
          break;
        default:
          throw new Error('Unknown form type');
      }

      if (result.success) {
        toast.success('Request created successfully!');
        queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
        onClose();
      } else {
        throw new Error(result.error || 'Failed to create request');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const renderKeyRequestFields = () => (
    <div className="space-y-4">
      <div>
        <Label>Request Type *</Label>
        <Select value={formData.request_type} onValueChange={(v) => updateField('request_type', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spare">Spare Key</SelectItem>
            <SelectItem value="replacement">Replacement Key</SelectItem>
            <SelectItem value="new">New Key</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Room Number</Label>
        <Input value={formData.room_number || ''} onChange={(e) => updateField('room_number', e.target.value)} />
      </div>
      <div>
        <Label>Other Location</Label>
        <Input value={formData.room_other || ''} onChange={(e) => updateField('room_other', e.target.value)} />
      </div>
      <div>
        <Label>Quantity *</Label>
        <Input type="number" min={1} value={formData.quantity || 1} onChange={(e) => updateField('quantity', parseInt(e.target.value))} />
      </div>
      <div>
        <Label>Reason *</Label>
        <Textarea value={formData.reason || ''} onChange={(e) => updateField('reason', e.target.value)} rows={3} />
      </div>
      <div>
        <Label>Emergency Contact</Label>
        <Input value={formData.emergency_contact || ''} onChange={(e) => updateField('emergency_contact', e.target.value)} />
      </div>
    </div>
  );

  const renderSupplyRequestFields = () => (
    <div className="space-y-4">
      <div>
        <Label>Title *</Label>
        <Input value={formData.title || ''} onChange={(e) => updateField('title', e.target.value)} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={formData.description || ''} onChange={(e) => updateField('description', e.target.value)} rows={2} />
      </div>
      <div>
        <Label>Justification *</Label>
        <Textarea value={formData.justification || ''} onChange={(e) => updateField('justification', e.target.value)} rows={3} />
      </div>
      <div>
        <Label>Priority *</Label>
        <Select value={formData.priority} onValueChange={(v) => updateField('priority', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Items *</Label>
        <div className="space-y-2 mt-2">
          {formData.items?.map((item: any, idx: number) => (
            <div key={idx} className="flex gap-2 items-center p-2 border rounded">
              <span className="flex-1">{item.item_name}</span>
              <Badge variant="secondary">Qty: {item.quantity}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMaintenanceFields = () => (
    <div className="space-y-4">
      <div>
        <Label>Title *</Label>
        <Input value={formData.title || ''} onChange={(e) => updateField('title', e.target.value)} />
      </div>
      <div>
        <Label>Description *</Label>
        <Textarea value={formData.description || ''} onChange={(e) => updateField('description', e.target.value)} rows={3} />
      </div>
      <div>
        <Label>Work Type</Label>
        <Input value={formData.work_type || ''} onChange={(e) => updateField('work_type', e.target.value)} placeholder="e.g., paint, flooring, lock change" />
      </div>
      <div>
        <Label>Priority *</Label>
        <Select value={formData.priority} onValueChange={(v) => updateField('priority', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label>Building</Label>
          <Input value={formData.building_name || ''} onChange={(e) => updateField('building_name', e.target.value)} />
        </div>
        <div>
          <Label>Floor</Label>
          <Input value={formData.floor_number || ''} onChange={(e) => updateField('floor_number', e.target.value)} />
        </div>
        <div>
          <Label>Room</Label>
          <Input value={formData.room_number || ''} onChange={(e) => updateField('room_number', e.target.value)} />
        </div>
      </div>
    </div>
  );

  const renderIssueFields = () => (
    <div className="space-y-4">
      <div>
        <Label>Issue Type *</Label>
        <Input value={formData.issue_type || ''} onChange={(e) => updateField('issue_type', e.target.value)} />
      </div>
      <div>
        <Label>Title</Label>
        <Input value={formData.title || ''} onChange={(e) => updateField('title', e.target.value)} />
      </div>
      <div>
        <Label>Description *</Label>
        <Textarea value={formData.description || ''} onChange={(e) => updateField('description', e.target.value)} rows={3} />
      </div>
      <div>
        <Label>Location *</Label>
        <Input value={formData.location_description || ''} onChange={(e) => updateField('location_description', e.target.value)} />
      </div>
      <div>
        <Label>Priority</Label>
        <Select value={formData.priority || 'medium'} onValueChange={(v) => updateField('priority', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review Extracted Data
            {submission.confidence_score && (
              <Badge variant={submission.confidence_score >= 0.8 ? 'default' : 'outline'}>
                {Math.round(submission.confidence_score * 100)}% confidence
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {submission.confidence_score < 0.8 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">Low confidence extraction</p>
                <p className="text-yellow-700 dark:text-yellow-200">Please review all fields carefully before submitting.</p>
              </div>
            </div>
          )}

          <div>
            <Label>Requestor Name</Label>
            <Input value={formData.requestor_name || ''} onChange={(e) => updateField('requestor_name', e.target.value)} />
          </div>
          
          <div>
            <Label>Requestor Email</Label>
            <Input type="email" value={formData.requestor_email || ''} onChange={(e) => updateField('requestor_email', e.target.value)} />
          </div>

          <div className="border-t pt-4">
            {submission.form_type === 'key_request' && renderKeyRequestFields()}
            {submission.form_type === 'supply_request' && renderSupplyRequestFields()}
            {submission.form_type === 'maintenance_request' && renderMaintenanceFields()}
            {submission.form_type === 'issue_report' && renderIssueFields()}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating Request...' : 'Create Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
