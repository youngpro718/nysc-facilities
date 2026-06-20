import { supabase } from '@/lib/supabase';

/**
 * Per-person supply "order codes". A code authorizes (and tags) large orders
 * without a human approval wait. The plaintext code never leaves the server —
 * verification happens in a SECURITY DEFINER RPC that returns only a boolean.
 */

/** Verify the current user's order code. Returns true on match. */
export async function verifySupplyOrderCode(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_supply_order_code', { p_code: code });
  if (error) throw error;
  return data === true;
}

/** Admin-only: set (or clear, with null/'') a person's order code. */
export async function setSupplyOrderCode(userId: string, code: string | null): Promise<void> {
  const { error } = await supabase.rpc('set_supply_order_code', {
    p_user_id: userId,
    p_code: code ?? '',
  });
  if (error) throw error;
}

/** Whether a user currently has an order code set (defaults to current user). */
export async function hasSupplyOrderCode(userId?: string): Promise<boolean> {
  const { data, error } = await supabase.rpc(
    'has_supply_order_code',
    userId ? { p_user_id: userId } : {},
  );
  if (error) throw error;
  return data === true;
}
