/**
 * Safely extract a user-friendly error message from an unknown caught value.
 *
 * Handles:
 * - Network failures → actionable reconnect copy
 * - PostgREST / Postgres errors → friendly message keyed on SQLSTATE code
 * - Generic Error / string / unknown fallbacks
 */

// Maps Postgres SQLSTATE + PostgREST codes to user-facing copy. Messages avoid
// jargon ("unique constraint", "foreign key") so non-technical court staff can
// act on them.
const POSTGRES_MESSAGES: Record<string, string> = {
  '23505': 'That item already exists.',
  '23503': 'This record is still referenced elsewhere and cannot be changed or removed.',
  '23502': 'A required field is missing.',
  '23514': 'One of the values is not allowed.',
  '22P02': 'One of the values is in the wrong format.',
  '42501': 'You do not have permission to perform this action.',
  '42P01': 'The data source is unavailable. Please try again shortly.',
  PGRST116: 'No matching record was found.',
  PGRST301: 'Your session has expired. Please sign in again.',
};

function isPostgrestLikeError(
  error: unknown
): error is { code?: string; message?: string; details?: string; hint?: string } {
  return !!error && typeof error === 'object' && ('code' in error || 'details' in error || 'hint' in error);
}

export function getErrorMessage(error: unknown): string {
  if (isPostgrestLikeError(error) && typeof error.code === 'string' && error.code in POSTGRES_MESSAGES) {
    return POSTGRES_MESSAGES[error.code];
  }

  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : isPostgrestLikeError(error) && typeof error.message === 'string'
        ? error.message
        : '';

  if (message) {
    const normalized = message.toLowerCase();
    if (
      normalized.includes('failed to fetch') ||
      normalized.includes('network error') ||
      normalized.includes('err_connection_closed')
    ) {
      return 'Unable to reach the server. Please check your internet connection and try again.';
    }

    // Raw Postgres text that leaked through without a code — translate the
    // most common shapes so we don't show "duplicate key value violates
    // unique constraint \"rooms_pkey\"" to end users.
    if (normalized.includes('duplicate key value')) {
      return POSTGRES_MESSAGES['23505'];
    }
    if (normalized.includes('violates foreign key')) {
      return POSTGRES_MESSAGES['23503'];
    }
    if (normalized.includes('violates not-null')) {
      return POSTGRES_MESSAGES['23502'];
    }
    if (normalized.includes('violates check constraint')) {
      return POSTGRES_MESSAGES['23514'];
    }
    if (normalized.includes('permission denied') || normalized.includes('row-level security')) {
      return POSTGRES_MESSAGES['42501'];
    }

    return message;
  }

  return 'An unknown error occurred';
}
