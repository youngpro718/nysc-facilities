
export type NormalizedSupabaseError = {
  code?: string;
  message: string;
  userMessage: string;
  isPermission?: boolean;
};

// Normalize Supabase and PostgREST-style errors into a consistent shape
export function normalizeSupabaseError(err: unknown): NormalizedSupabaseError {
  // Supabase can throw strings, Error objects, or PostgREST error payloads
  const anyErr = err as Record<string, unknown>;
  const rawMessage: string = String(anyErr?.message || anyErr?.error_description || anyErr?.error || err);
  const code: string | undefined = (anyErr?.code || anyErr?.status || anyErr?.hint) as string | undefined;

  // Detect common permission/authorization denials
  const text = (rawMessage || '').toLowerCase();
  const isPermission =
    text.includes('permission denied') ||
    text.includes('not authorized') ||
    text.includes('rls') ||
    text.includes('requires admin') ||
    anyErr?.status === 401 ||
    anyErr?.status === 403;

  if (isPermission) {
    return {
      code: code ?? 'permission_denied',
      message: rawMessage,
      userMessage: 'This action is restricted. Please contact an administrator if you believe this is a mistake.',
      isPermission: true,
    };
  }

  // Constraint / FK issues
  const isConstraint =
    text.includes('constraint') ||
    text.includes('foreign key') ||
    text.includes('unique violation') ||
    text.includes('violates');

  if (isConstraint) {
    return {
      code: code ?? 'constraint_violation',
      message: rawMessage,
      userMessage: 'This item is linked to other records. Consider removing related items or using a safe admin action.',
    };
  }

  return {
    code,
    message: rawMessage,
    userMessage: 'Something went wrong. Please try again.',
  };
}
