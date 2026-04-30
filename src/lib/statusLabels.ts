/**
 * statusLabels — central map between internal workflow statuses and the
 * plain-language wording shown to standard (non-staff) users.
 *
 * The DB and staff-facing UIs continue to use the internal codes; only
 * user-facing surfaces import from this file. This guarantees consistency
 * and keeps onboarding intuitive ("Sent" / "Being prepared" / "Ready to
 * pick up" / "Done") regardless of how many internal substates exist.
 */

export type FriendlyTone =
  | 'pending'
  | 'progress'
  | 'ready'
  | 'done'
  | 'attention'
  | 'cancelled';

export interface FriendlyStatus {
  label: string;
  tone: FriendlyTone;
  description: string;
}

const TONE_CLASSES: Record<FriendlyTone, string> = {
  pending: 'bg-status-info/15 text-status-info border-status-info/20',
  progress: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20',
  ready: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  done: 'bg-muted text-muted-foreground border-border',
  attention: 'bg-destructive/15 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground border-border line-through',
};

export function toneClasses(tone: FriendlyTone): string {
  return TONE_CLASSES[tone];
}

// Supply request workflow ----------------------------------------------------
const SUPPLY_MAP: Record<string, FriendlyStatus> = {
  submitted: { label: 'Sent', tone: 'pending', description: 'Your request was received and is waiting for review.' },
  pending_approval: { label: 'Awaiting approval', tone: 'pending', description: 'A coordinator is reviewing your request.' },
  approved: { label: 'Approved', tone: 'progress', description: 'Approved — being prepared by the supply team.' },
  received: { label: 'Being prepared', tone: 'progress', description: 'The supply team has started gathering your items.' },
  picking: { label: 'Being prepared', tone: 'progress', description: 'Items are being picked from the supply room.' },
  packing: { label: 'Almost ready', tone: 'progress', description: 'Your items are being packed.' },
  ready: { label: 'Ready to pick up', tone: 'ready', description: 'Your supplies are ready! Pick them up at the supply room.' },
  fulfilled: { label: 'Done', tone: 'done', description: 'Order completed.' },
  completed: { label: 'Done', tone: 'done', description: 'Order completed.' },
  rejected: { label: 'Not approved', tone: 'attention', description: 'This request was not approved. See notes for details.' },
  cancelled: { label: 'Cancelled', tone: 'cancelled', description: 'This request was cancelled.' },
};

// Issue (Building Issues) workflow ------------------------------------------
const ISSUE_MAP: Record<string, FriendlyStatus> = {
  open: { label: 'Reported', tone: 'pending', description: "We've got it — waiting to be assigned." },
  in_progress: { label: 'Being worked on', tone: 'progress', description: 'Someone is actively working on this.' },
  on_hold: { label: 'On hold', tone: 'attention', description: 'Paused — usually waiting for parts or info.' },
  resolved: { label: 'Resolved', tone: 'done', description: 'Fixed. Reopen if the problem comes back.' },
  closed: { label: 'Closed', tone: 'done', description: 'This issue is closed.' },
};

// Key request workflow ------------------------------------------------------
const KEY_MAP: Record<string, FriendlyStatus> = {
  pending: { label: 'Awaiting approval', tone: 'pending', description: 'Waiting for a coordinator to approve.' },
  approved: { label: 'Approved', tone: 'progress', description: 'Approved — your key is being prepared.' },
  ready: { label: 'Ready to pick up', tone: 'ready', description: 'Your key is ready at the key office.' },
  fulfilled: { label: 'Done', tone: 'done', description: 'Key delivered.' },
  rejected: { label: 'Not approved', tone: 'attention', description: 'Key request was not approved.' },
  cancelled: { label: 'Cancelled', tone: 'cancelled', description: 'This request was cancelled.' },
};

const FALLBACK: FriendlyStatus = {
  label: 'Updated',
  tone: 'progress',
  description: 'Status updated.',
};

export function getFriendlySupplyStatus(status?: string | null): FriendlyStatus {
  if (!status) return FALLBACK;
  return SUPPLY_MAP[status] ?? { ...FALLBACK, label: humanize(status) };
}

export function getFriendlyIssueStatus(status?: string | null): FriendlyStatus {
  if (!status) return FALLBACK;
  return ISSUE_MAP[status] ?? { ...FALLBACK, label: humanize(status) };
}

export function getFriendlyKeyStatus(status?: string | null): FriendlyStatus {
  if (!status) return FALLBACK;
  return KEY_MAP[status] ?? { ...FALLBACK, label: humanize(status) };
}

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
