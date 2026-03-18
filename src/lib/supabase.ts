// IMPORTANT: This is the ONLY file that should import directly from integrations
// All other files should import from '@/lib/supabase'

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { API_CONFIG } from '@/config';

export const supabase = createClient(API_CONFIG.supabase.url, API_CONFIG.supabase.anonKey, {
  auth: {
    persistSession: true,
    storageKey: 'app-auth',
    // sessionStorage is safer than localStorage: tokens are not accessible to
    // other tabs and are cleared when the browser tab closes, limiting the XSS
    // exfiltration window (localStorage tokens persist until explicitly removed).
    storage: sessionStorage,
    autoRefreshToken: true,
    // Must be true so that Supabase can extract the access_token from the URL
    // hash after email verification / OAuth redirects. With false, email
    // confirmation links redirect to the app but the session is not picked up,
    // leaving the user appearing unauthenticated.
    detectSessionInUrl: true,
  },
});

export const supabaseWithRetry = {
  async query<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error;
        if (error?.message?.includes('Failed to fetch') || 
            error?.message?.includes('ERR_CONNECTION_CLOSED') ||
            error?.message?.includes('Network Error')) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      }
    }
    throw lastError;
  }
};

// Export the supabase client type for use in other files
export type SupabaseClient = typeof supabase;

// Auth service functions — only methods used by useAuth.tsx
// For signIn/signUp, use services/auth.ts or hooks/security/useSecureAuth.ts
export const authService = {
  signOut: async () => {
    return supabase.auth.signOut();
  },
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },
  fetchUserProfile: async (userId: string) => {
    const startTime = Date.now();
    logger.debug('[authService.fetchUserProfile] Starting parallel fetch for user:', userId);
    
    // OPTIMIZATION: Fetch user roles and profile in parallel instead of sequentially
    const [rolesResult, profileResult] = await Promise.all([
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select(`
          *,
          departments(name)
        `)
        .eq('id', userId)
        .maybeSingle()
    ]);

    if (rolesResult.error) {
      logger.error('[authService.fetchUserProfile] Error fetching user roles:', rolesResult.error);
    }

    if (profileResult.error) {
      logger.error('[authService.fetchUserProfile] Error fetching profile:', profileResult.error);
    }

    const role = rolesResult.data?.role || 'standard';
    const isAdmin = role === 'admin';
    const profile = profileResult.data ? { ...profileResult.data, role } : null;

    const elapsed = Date.now() - startTime;
    logger.debug(`[authService.fetchUserProfile] Completed in ${elapsed}ms - role: ${role}, isAdmin: ${isAdmin}, profile: ${!!profile}`);

    return { isAdmin, profile };
  },
  updateSessionTracking: async (userId: string, deviceInfo: any) => {
    // OPTIMIZATION: Use upsert for single round-trip instead of select-then-update/insert
    try {
      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: userId,
          device_info: deviceInfo,
          last_active_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });
      
      if (error) {
        logger.error('[authService.updateSessionTracking] Error:', error);
      }
    } catch (error) {
      logger.error('[authService.updateSessionTracking] Exception:', error);
    }
  },
  deleteUserSession: async (userId: string) => {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      logger.error('[authService.deleteUserSession] Error:', error);
    }
  }
};

