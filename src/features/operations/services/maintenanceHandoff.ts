/**
 * Maintenance DCAS handoff coordination.
 *
 * The app doesn't dispatch DCAS — that happens externally via Archibus, email,
 * or phone. This service tracks WHETHER the person who scheduled the work has
 * remembered to coordinate with DCAS and records what was filed.
 */

import { supabase } from '@/lib/supabase';

export type HandoffStatus =
  | 'not_notified'
  | 'notified'
  | 'filed'
  | 'confirmed'
  | 'not_required';

export interface MaintenanceWithHandoff {
  id: string;
  title: string;
  description: string | null;
  maintenance_type: string;
  status: string;
  priority: string | null;
  space_name: string;
  space_id: string | null;
  scheduled_start_date: string;
  scheduled_end_date: string | null;
  notes: string | null;
  special_instructions: string | null;
  external_system: string | null;
  external_ticket_number: string | null;
  external_ticket_status: HandoffStatus;
  external_ticket_entered_at: string | null;
  external_ticket_entered_by: string | null;
}

export interface UpdateHandoffInput {
  status: HandoffStatus;
  external_system?: string | null;
  external_ticket_number?: string | null;
}

export async function updateMaintenanceHandoff(
  scheduleId: string,
  input: UpdateHandoffInput,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const isLogged = input.status === 'notified' || input.status === 'filed' || input.status === 'confirmed';

  const patch: Record<string, unknown> = {
    external_ticket_status: input.status,
    external_system: input.external_system ?? null,
    external_ticket_number: input.external_ticket_number?.trim() || null,
  };
  if (isLogged) {
    patch.external_ticket_entered_at = new Date().toISOString();
    patch.external_ticket_entered_by = userData?.user?.id ?? null;
  } else {
    // Clearing back to "not_notified" / "not_required" wipes the log.
    patch.external_ticket_entered_at = null;
    patch.external_ticket_entered_by = null;
  }

  const { error } = await supabase
    .from('maintenance_schedules')
    .update(patch)
    .eq('id', scheduleId);

  if (error) throw error;
}

/**
 * Returns maintenance schedules that still need a DCAS handoff: status is
 * 'not_notified' or 'notified' (but no ticket # yet), and the work is still
 * in the future or hasn't been completed.
 */
export async function listPendingHandoffs(): Promise<MaintenanceWithHandoff[]> {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .select(`
      id, title, description, maintenance_type, status, priority,
      space_name, space_id, scheduled_start_date, scheduled_end_date,
      notes, special_instructions,
      external_system, external_ticket_number, external_ticket_status,
      external_ticket_entered_at, external_ticket_entered_by
    `)
    .in('external_ticket_status', ['not_notified', 'notified'])
    .in('status', ['scheduled', 'in_progress'])
    .order('scheduled_start_date', { ascending: true });

  if (error) throw error;
  return (data || []) as MaintenanceWithHandoff[];
}

/**
 * Build a copyable plain-text summary the user can paste into Archibus or
 * email to DCAS. Plain text on purpose — it has to survive a copy/paste.
 */
export function buildHandoffSummary(item: MaintenanceWithHandoff): string {
  const lines: string[] = [];
  lines.push(`Work request: ${prettyType(item.maintenance_type)} — ${item.title}`);
  lines.push(`Location: ${item.space_name}`);
  lines.push(`Scheduled: ${formatRange(item.scheduled_start_date, item.scheduled_end_date)}`);
  if (item.priority) lines.push(`Priority: ${item.priority}`);
  if (item.description) lines.push('', item.description);
  if (item.special_instructions) {
    lines.push('', `Notes for vendor: ${item.special_instructions}`);
  }
  return lines.join('\n');
}

function prettyType(t: string): string {
  if (!t) return 'Maintenance';
  return t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, ' ');
}

function formatRange(start: string, end: string | null): string {
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const date = s.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const sTime = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (!e) return `${date} at ${sTime}`;
  const eTime = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date}, ${sTime} – ${eTime}`;
}

/**
 * Color-grade by urgency for the badge UI: how many business days until the
 * scheduled date. Past-due == handoff overdue.
 */
export type HandoffUrgency = 'past_due' | 'urgent' | 'soon' | 'quiet';

export function handoffUrgency(scheduledStart: string): HandoffUrgency {
  const target = new Date(scheduledStart);
  const now = new Date();
  if (target < now) return 'past_due';
  const days = businessDaysBetween(now, target);
  if (days < 5) return 'urgent';
  if (days < 10) return 'soon';
  return 'quiet';
}

function businessDaysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  const totalDays = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (totalDays <= 0) return 0;
  // Rough: 5/7 of total days are weekdays.
  return Math.round(totalDays * (5 / 7));
}
