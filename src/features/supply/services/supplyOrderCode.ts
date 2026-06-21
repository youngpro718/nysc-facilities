import { supabase } from '@/lib/supabase';

/**
 * Per-person supply order codes (4-digit). The code is generated server-side,
 * stored in plain text, and shown to its owner on their profile page. When
 * someone tries to order more than an item's `order_code_threshold`, the cart
 * prompts for this code; submitting the right code authorizes the order as
 * the requester's own (no supervisor wait).
 *
 * Migration: 081_supply_order_codes_per_user.sql
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

/** Verify a code against the current user's row. Used by the cart at submit. */
export async function verifySupplyOrderCode(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_supply_order_code', { p_code: code });
  if (error) throw error;
  return data === true;
}
