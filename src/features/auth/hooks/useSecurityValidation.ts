import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { RETRY } from '@/config';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function useSecurityValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validateEmail = useCallback(async (email: string): Promise<ValidationResult> => {
    try {
      const { data, error } = await supabase.rpc('validate_email_format', { email });
      if (!error) {
        return { isValid: data, errors: data ? [] : ['Invalid email format'] };
      }
      // RPC unavailable — fall back to client-side check
      logger.warn('validate_email_format RPC unavailable, using client-side fallback');
    } catch {
      logger.warn('validate_email_format RPC unavailable, using client-side fallback');
    }
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    return { isValid: valid, errors: valid ? [] : ['Invalid email format'] };
  }, []);

  const validatePassword = useCallback(async (password: string): Promise<ValidationResult> => {
    try {
      const { data, error } = await supabase.rpc('validate_password_strength', { password });
      
      if (error) throw error;
      
      // Type guard for the returned data structure
      const isValidResponse = (obj: Record<string, unknown>): obj is { is_valid: boolean; errors: string[] } => {
        return obj && typeof obj === 'object' && 'is_valid' in obj && 'errors' in obj;
      };

      if (isValidResponse(data)) {
        return {
          isValid: Boolean(data.is_valid),
          errors: Array.isArray(data.errors) ? data.errors : []
        };
      }
      
      return {
        isValid: false,
        errors: ['Invalid response from password validation']
      };
    } catch (error) {
      logger.error('Password validation error:', error);
      return {
        isValid: false,
        errors: ['Password validation failed']
      };
    }
  }, []);

  const sanitizeInput = useCallback(async (input: string): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('sanitize_input', { input_text: input });
      
      if (error) throw error;
      
      return data || input;
    } catch (error) {
      logger.error('Input sanitization error:', error);
      return input; // Return original input if sanitization fails
    }
  }, []);

  const checkRateLimit = useCallback(async (
    identifier: string,
    attemptType: string,
    maxAttempts: number = RETRY.securityMaxAttempts,
    windowMinutes: number = 15
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_attempt_type: attemptType,
        p_max_attempts: maxAttempts,
        p_window_minutes: windowMinutes
      });

      if (error) {
        // RPC unavailable — fail open so users can still sign in/up
        logger.warn('Rate limit check RPC unavailable, allowing attempt:', error);
        return true;
      }

      return Boolean(data);
    } catch (error) {
      // RPC unavailable — fail open so users can still sign in/up
      logger.warn('Rate limit check RPC unavailable, allowing attempt:', error);
      return true;
    }
  }, []);

  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('validate_user_session');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      logger.error('Session validation error:', error);
      return false;
    }
  }, []);

  const logSecurityEvent = useCallback(async (
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, unknown>
  ) => {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        action_type: action,
        resource_type: resourceType,
        resource_id: resourceId || '00000000-0000-0000-0000-000000000000',
        details: details ?? {}
      });
      
      if (error) throw error;
    } catch (error) {
      logger.warn('Security event logging error (non-blocking):', error);
      // Fallback logging - continue operation even if audit logging fails
    }
  }, []);

  return {
    isValidating,
    validateEmail,
    validatePassword,
    sanitizeInput,
    checkRateLimit,
    validateSession,
    logSecurityEvent
  };
}