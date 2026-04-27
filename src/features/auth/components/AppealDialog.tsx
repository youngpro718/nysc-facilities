import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { DialogFooter } from '@/components/ui/dialog';
import { ModalFrame } from '@shared/components/common/common/ModalFrame';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AppealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppealDialog({ open, onOpenChange }: AppealDialogProps) {
  const navigate = useNavigate();
  const [appealReason, setAppealReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!appealReason.trim()) {
      setError('Please provide a reason for your appeal');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('submit_verification_appeal', {
        p_appeal_reason: appealReason.trim(),
        p_additional_info: additionalInfo.trim() || null,
      });

      if (rpcError) throw rpcError;

      logger.info('[AppealDialog] Appeal submitted successfully', { appealId: data });
      setSuccess(true);

      // Close dialog and show success message after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setAppealReason('');
        setAdditionalInfo('');
      }, 2000);
    } catch (err) {
      logger.error('[AppealDialog] Failed to submit appeal:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit appeal';
      
      if (errorMessage.includes('already have a pending appeal')) {
        setError('You already have a pending appeal. Please wait for admin review.');
      } else if (errorMessage.includes('Only rejected users')) {
        setError('Only rejected users can submit appeals.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setAppealReason('');
      setAdditionalInfo('');
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <ModalFrame
      open={open}
      onOpenChange={handleClose}
      size="md"
      title="Request Account Review"
      description="Submit an appeal to request re-review of your account. An administrator will review your request and may approve you for re-evaluation."
    >

        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your appeal has been submitted successfully. An administrator will review it soon.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="appeal-reason">
                Reason for Appeal <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="appeal-reason"
                placeholder="Please explain why you believe your account should be reconsidered..."
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                rows={4}
                disabled={isSubmitting}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Be specific about why you should be granted access.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional-info">Additional Information (Optional)</Label>
              <Textarea
                id="additional-info"
                placeholder="Any additional context, documentation, or information that supports your appeal..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={3}
                disabled={isSubmitting}
                className="resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {!success && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !appealReason.trim()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Appeal
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
