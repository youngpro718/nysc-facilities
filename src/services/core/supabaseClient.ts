/**
 * Supabase Client - Core Service
 * 
 * This is the ONLY file that should import the Supabase client directly.
 * All other services should import from this file.
 * 
 * @module services/core/supabaseClient
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export { supabase };

/**
 * Type-safe Supabase client
 * Use this for all database operations in services
 */
export const db = supabase;

/**
 * Helper function to handle Supabase errors
 */
export function handleSupabaseError(error: unknown, context: string): never {
  const message = error?.message || 'Unknown error occurred';
  logger.error(`[Supabase Error - ${context}]:`, error);
  throw new Error(`${context}: ${message}`);
}

/**
 * Helper function to validate required data
 */
export function validateData<T>(data: T | null, context: string): T {
  if (!data) {
    throw new Error(`${context}: No data returned`);
  }
  return data;
}
