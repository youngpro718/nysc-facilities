import { toast } from 'sonner';

export type RequestType = 'supply' | 'request';

export interface SubmittedToastOpts {
  id: string;
  type: RequestType;
  needsApproval?: boolean;
}

export function formatShortId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

/**
 * Fire the canonical "request submitted" toast — same shape for supply
 * orders and court-aide tasks. The `View` action lands on /my-requests
 * with the new row highlighted via ?focus=<id>.
 */
export function requestSubmittedToast({ id, type, needsApproval }: SubmittedToastOpts) {
  const shortId = formatShortId(id);
  const noun = type === 'supply' ? 'Order' : 'Request';
  const verb = needsApproval ? 'sent for approval' : 'submitted';
  toast.success(`${noun} ${shortId} ${verb}`, {
    duration: 6000,
    action: {
      label: 'View',
      onClick: () => {
        window.location.assign(`/my-requests?focus=${id}`);
      },
    },
  });
}

export function requestFailedToast(message: string) {
  toast.error(message);
}
