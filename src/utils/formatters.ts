
/**
 * Formats a phone number string to a more readable format
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  
  // Strip any non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return original if we can't format it
  return phone;
}

/**
 * Formats an array of clerk names into a readable string
 */
export function formatClerks(clerks: string[] | null | undefined): string {
  if (!clerks || clerks.length === 0) return "—";
  
  if (clerks.length === 1) return clerks[0];
  
  if (clerks.length === 2) return `${clerks[0]} and ${clerks[1]}`;
  
  return `${clerks[0]} and ${clerks.length - 1} others`;
}

/**
 * Formats a part code/ID for display
 */
export function formatPart(part: string | null | undefined, prefix: string = "Part "): string {
  if (!part) return "—";
  return prefix + part;
}
