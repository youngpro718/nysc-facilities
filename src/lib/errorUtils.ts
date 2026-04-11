/**
 * Safely extract an error message from an unknown caught value.
 */
export function getErrorMessage(error: unknown): string {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
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

    return message;
  }

  return 'An unknown error occurred';
}
