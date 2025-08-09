
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Read from Vite environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Non-fatal warning to assist local/dev setups
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.\n' +
      'Create a .env.local with:\n' +
      'VITE_SUPABASE_URL=your-project-url\n' +
      'VITE_SUPABASE_ANON_KEY=your-anon-key'
  );
}

export const supabase = createClient<Database>(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: true,
      storageKey: 'app-auth',
      storage: localStorage,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Connection: 'keep-alive',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Enhanced query wrapper with retry logic
export const supabaseWithRetry = {
  async query<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a connection error
        if (error?.message?.includes('Failed to fetch') || 
            error?.message?.includes('ERR_CONNECTION_CLOSED') ||
            error?.message?.includes('Network Error')) {
          
          console.warn(`Supabase connection attempt ${attempt}/${maxRetries} failed:`, error.message);
          
          if (attempt < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // If it's not a connection error, throw immediately
        throw error;
      }
    }
    
    throw lastError;
  }
};
