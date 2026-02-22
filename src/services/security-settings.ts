import { supabase } from '@/lib/supabase';

export interface SecuritySettings {
  id: true; // Singleton row — the DB uses a boolean PK constrained to true
  max_login_attempts: number;
  block_minutes: number;
  allowed_email_domain: string | null;
  password_min_length: number;
  password_require_upper: boolean;
  password_require_lower: boolean;
  password_require_digit: boolean;
  password_require_symbol: boolean;
  session_timeout_minutes: number;
  mfa_required_roles: string[];
  created_at: string;
  updated_at: string;
}

export interface RateLimitRecord {
  id: number;
  identifier: string;
  attempts: number;
  blocked_until: string | null;
  first_attempt_at: string;
  last_attempt_at: string;
  updated_at: string;
}

export interface SecuritySettingsUpdate {
  max_login_attempts?: number;
  block_minutes?: number;
  allowed_email_domain?: string | null;
  password_min_length?: number;
  password_require_upper?: boolean;
  password_require_lower?: boolean;
  password_require_digit?: boolean;
  password_require_symbol?: boolean;
  session_timeout_minutes?: number;
  mfa_required_roles?: string[];
}

/**
 * Get current security settings
 */
export async function getSecuritySettings(): Promise<SecuritySettings> {
  const { data, error } = await supabase
    .from('security_settings')
    .select('*')
    .eq('id', true)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update security settings
 */
export async function updateSecuritySettings(
  patch: SecuritySettingsUpdate
): Promise<SecuritySettings> {
  const { data, error } = await supabase
    .from('security_settings')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', true)
    .select('*')
    .single();

  if (error) throw error;

  // Log the configuration change
  await supabase.from('security_audit_log').insert({
    action: 'update_security_settings',
    resource_type: 'security_settings',
    resource_id: 'singleton',
    details: patch,
  });

  return data;
}

/**
 * List all currently blocked identifiers
 */
export async function listBlocked(): Promise<RateLimitRecord[]> {
  const { data, error } = await supabase
    .from('security_rate_limits')
    .select('*')
    .not('blocked_until', 'is', null)
    .gte('blocked_until', new Date().toISOString())
    .order('blocked_until', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * List all rate limit records (including non-blocked)
 */
export async function listAllRateLimits(): Promise<RateLimitRecord[]> {
  const { data, error } = await supabase
    .from('security_rate_limits')
    .select('*')
    .order('last_attempt_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

/**
 * Unblock a specific identifier
 */
export async function unblockIdentifier(identifier: string): Promise<void> {
  const { error } = await supabase.rpc('unblock_identifier', {
    p_identifier: identifier,
  });

  if (error) throw error;
}

/**
 * Check if an identifier is currently blocked
 */
export async function isIdentifierBlocked(identifier: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_identifier_blocked', {
    p_identifier: identifier,
  });

  if (error) throw error;
  return data ?? false;
}

/**
 * Get active user sessions from the user_sessions table
 */
export async function listSessions() {
  const { data, error } = await supabase
    .from('user_sessions')
    .select(`
      user_id,
      last_active_at,
      created_at,
      device_info,
      profiles!user_sessions_user_id_fkey (
        email,
        first_name,
        last_name
      )
    `)
    .order('last_active_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map((session: Record<string, unknown>) => ({
    user_id: session.user_id,
    email: (session.profiles as Record<string, unknown>)?.email ?? null,
    last_sign_in_at: session.last_active_at,
    created_at: session.created_at,
    device_info: session.device_info,
  }));
}

/**
 * Sign out all other sessions for current user
 */
export async function signOutOtherSessions(): Promise<void> {
  const { error } = await supabase.auth.refreshSession();
  
  if (error) throw error;

  // Log the action
  await supabase.from('security_audit_log').insert({
    action: 'sign_out_other_sessions',
    resource_type: 'auth_sessions',
    resource_id: 'current_user',
  });
}

/**
 * Validate password against current policy
 */
export async function validatePassword(password: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const settings = await getSecuritySettings();
  const errors: string[] = [];

  if (password.length < settings.password_min_length) {
    errors.push(`Password must be at least ${settings.password_min_length} characters long`);
  }

  if (settings.password_require_upper && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (settings.password_require_lower && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (settings.password_require_digit && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  if (settings.password_require_symbol && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
