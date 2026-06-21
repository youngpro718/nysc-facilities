import { ModalFrame } from '@shared/components/common/common/ModalFrame';
import { KeyRequestForm } from './KeyRequestForm';

interface KeyRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Modal entry point for the key-request form. Kept thin — the form body lives
 * in {@link KeyRequestForm} so the same UI can render at /keys/request.
 */
export function KeyRequestDialog({ open, onOpenChange, onSuccess }: KeyRequestDialogProps) {
  return (
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Request a Key"
      description="Send a key request to the facilities key office."
      size="md"
    >
      <KeyRequestForm
        variant="dialog"
        onCancel={() => onOpenChange(false)}
        onSuccess={() => {
          onOpenChange(false);
          onSuccess?.();
        }}
      />
    </ModalFrame>
  );
}
