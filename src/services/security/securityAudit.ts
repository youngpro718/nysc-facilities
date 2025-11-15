import { supabase } from '@/lib/supabase';

export type SecurityOperationParams = {
  operation_type: string;
  target_resource?: string | null;
  operation_details?: Record<string, any>;
  success: boolean;
  error_message?: string | null;
};

/**
 * Strongly-typed wrapper for the `public.log_security_operation` DB function.
 * Enforces `success: boolean` at the call site to match the database contract.
 */
export async function logSecurityOperation({
  operation_type,
  target_resource = null,
  operation_details = {},
  success,
  error_message = null,
}: SecurityOperationParams): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_security_operation', {
      operation_type,
      target_resource,
      operation_details,
      success,
      error_message,
    });

    if (error) throw error;
  } catch (err) {
    // Do not throw to avoid disrupting primary flows; follow DB function behavior
    // Log locally for observability
    console.error('[securityAudit] Failed to log security operation:', err);
  }
}

// Convenience helpers
export async function logSecuritySuccess(
  operation_type: string,
  options?: { target_resource?: string | null; operation_details?: Record<string, any> }
) {
  return logSecurityOperation({
    operation_type,
    target_resource: options?.target_resource ?? null,
    operation_details: options?.operation_details ?? {},
    success: true,
  });
}

export async function logSecurityFailure(
  operation_type: string,
  options?: {
    target_resource?: string | null;
    operation_details?: Record<string, any>;
    error_message?: string | null;
  }
) {
  return logSecurityOperation({
    operation_type,
    target_resource: options?.target_resource ?? null,
    operation_details: options?.operation_details ?? {},
    success: false,
    error_message: options?.error_message ?? null,
  });
}
