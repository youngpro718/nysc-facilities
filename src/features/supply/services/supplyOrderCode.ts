import { supabase } from '@/lib/supabase';

/**
 * Per-person supply order codes (4-digit). The code is generated server-side,
 * stored in plain text, and shown to its owner on their profile page.
 *
 * Two uses:
 *   1. Personal "access code" — when a line exceeds an item's
 *      order_code_threshold the cart prompts for THIS user's own code,
 *      authorizing the larger order without supervisor wait.
 *   2. Supervisor approval — when a cart contains any item / category flagged
 *      as `requires_supervisor_approval`, the cart prompts for a
 *      SUPERVISOR'S code. Verified server-side against profiles.is_supervisor
 *      via `verify_supervisor_code`, which returns the supervisor's user id
 *      so the request can be stamped and the supervisor notified.
 *
 * Migrations: 081_supply_order_codes_per_user.sql (base), plus the
 * supervisor-approval migration adding is_supervisor + verify_supervisor_code.
 */

/** Fetch the current user's code, generating one on first call. */
export async function getMySupplyOrderCode(): Promise<string> {
  const { data, error } = await supabase.rpc('get_my_supply_order_code');
  if (error) throw error;
  return data as string;
}

/** Rotate the current user's code. Returns the new code. */
export async function regenerateMySupplyOrderCode(): Promise<string> {
  const { data, error } = await supabase.rpc('regenerate_my_supply_order_code');
  if (error) throw error;
  return data as string;
}

/** Verify a code against the current user's row. Used by the cart at submit
 * for the personal access-code path (large orders). */
export async function verifySupplyOrderCode(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_supply_order_code', { p_code: code });
  if (error) throw error;
  return data === true;
}

/**
 * Verify a supervisor code. Returns the supervisor's user id if the code
 * matches a *supervisor* (profiles.is_supervisor = true) and is NOT the
 * requester's own code. Returns null otherwise. Used by the cart when the
 * order contains any item or category flagged as requiring supervisor
 * approval — a successful verify skips the pending-approval queue and stamps
 * `approved_by_supervisor_id` on the request so the supervisor is notified.
 */
export async function verifySupervisorCode(code: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('verify_supervisor_code', { p_code: code });
  if (error) throw error;
  return (data as string | null) ?? null;
}
