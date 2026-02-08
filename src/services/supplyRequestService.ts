/**
 * Supply Request Service
 * 
 * Admin operations for supply requests (delete, bulk actions)
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/**
 * Delete a supply request and all related data (admin only)
 * RLS policies ensure only admins can perform this action
 */
export async function deleteSupplyRequest(requestId: string): Promise<void> {
  // Delete status history first (child records)
  const { error: historyError } = await supabase
    .from('supply_request_status_history')
    .delete()
    .eq('request_id', requestId);

  if (historyError) {
    logger.error('Failed to delete status history:', historyError);
    // Continue anyway - main delete might still work
  }

  // Delete request items (child records)
  const { error: itemsError } = await supabase
    .from('supply_request_items')
    .delete()
    .eq('request_id', requestId);

  if (itemsError) {
    logger.error('Failed to delete request items:', itemsError);
    throw new Error(`Failed to delete request items: ${itemsError.message}`);
  }

  // Delete the main request
  const { error: requestError } = await supabase
    .from('supply_requests')
    .delete()
    .eq('id', requestId);

  if (requestError) {
    throw new Error(`Failed to delete request: ${requestError.message}`);
  }
}

/**
 * Delete multiple supply requests (admin only)
 */
export async function deleteMultipleSupplyRequests(requestIds: string[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const id of requestIds) {
    try {
      await deleteSupplyRequest(id);
      success++;
    } catch (error) {
      logger.error(`Failed to delete request ${id}:`, error);
      failed++;
    }
  }

  return { success, failed };
}
