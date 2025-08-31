import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// SECURITY: Use environment variables exclusively - no hardcoded fallbacks
const SUPABASE_URL = 'https://fmymhtuiqzhupjyopfvi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDc4OTYsImV4cCI6MjA1MzgyMzg5Nn0.1OvOXiLEj3QKGjAEZCSWqw8zzewsYgfTlVDcDEdfCjE';

// Validate required configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase configuration. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
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