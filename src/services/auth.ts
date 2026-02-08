// src/services/auth.ts
// Enhanced authentication service with email verification enforcement
import { supabase } from '@/lib/supabase';

/**
 * Sign up a new user with email verification required
 * @param email - User's email address
 * @param password - User's password
 * @param fullName - Optional full name for the user profile
 * @returns The created user object
 * @throws Error if signup fails or validation fails
 */
export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName ?? '' },
      emailRedirectTo: `${location.origin}/`
    }
  });
  
  if (error) throw error;
  return data.user;
}

/**
 * Sign in with email and password, enforcing email verification
 * @param email - User's email address
 * @param password - User's password
 * @returns The authenticated user object
 * @throws Error if credentials are invalid or email is not verified
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });
  
  if (error) throw error;
  
  // Enforce email verification - block unverified logins
  if (!data.user?.email_confirmed_at) {
    // Sign out the user immediately
    await supabase.auth.signOut();
    throw new Error('Email not verified. Please check your email for the verification link.');
  }
  
  return data.user;
}

/**
 * Sign out the current user
 * @throws Error if sign out fails
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Request a password reset email
 * @param email - User's email address
 * @throws Error if request fails
 */
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/auth/reset`,
  });
  if (error) throw error;
}

/**
 * Get the current authenticated user
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Get the current session
 * @returns The current session or null if not authenticated
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Resend verification email
 * @param email - User's email address
 * @throws Error if request fails
 */
export async function resendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${location.origin}/auth/verify`
    }
  });
  if (error) throw error;
}
