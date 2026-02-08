import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const DEFAULT_EMAIL = 'facilities@example.com';
const DEFAULT_PHONE = '(555) 123-4567';

let cachedEmail: string | null = null;

export async function getFacilityEmail(): Promise<string> {
  // Return cached value if available
  if (cachedEmail) {
    return cachedEmail;
  }

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('admin_email')
      .limit(1)
      .single();

    if (error) {
      logger.error('Error fetching facility email:', error);
      return DEFAULT_EMAIL;
    }

    // Handle empty email or no data
    if (!data || !data.admin_email || data.admin_email.trim() === '') {
      return DEFAULT_EMAIL;
    }

    cachedEmail = data.admin_email;
    return cachedEmail;
  } catch (error) {
    logger.error('Error in getFacilityEmail:', error);
    return DEFAULT_EMAIL;
  }
}

export function getFacilityPhone(): string {
  return DEFAULT_PHONE;
}

export function getFacilityContactInfo() {
  return {
    email: getFacilityEmail(),
    phone: getFacilityPhone(),
  };
}

// Clear cache when email is updated
export function clearEmailCache() {
  cachedEmail = null;
}
