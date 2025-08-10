import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function useSecurityValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validateEmail = useCallback(async (email: string): Promise<ValidationResult> => {
    try {
      const { data, error } = await supabase.rpc('validate_email_format', { email });
      
      if (error) throw error;
      
      return {
        isValid: data,
        errors: data ? [] : ['Invalid email format']
      };
    } catch (error) {
      console.error('Email validation error:', error);
      return {
        isValid: false,
        errors: ['Email validation failed']
      };
    }
  }, []);

  const validatePassword = useCallback(async (password: string): Promise<ValidationResult> => {
    try {
      const { data, error } = await supabase.rpc('validate_password_strength', { password });
      
      if (error) throw error;
      
      // Type guard for the returned data structure
      const isValidResponse = (obj: any): obj is { is_valid: boolean; errors: string[] } => {
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
      console.error('Password validation error:', error);
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
      console.error('Input sanitization error:', error);
      return input; // Return original input if sanitization fails
    }
  }, []);

  const checkRateLimit = useCallback(async (
    identifier: string, 
    attemptType: string,
    maxAttempts: number = 5,
    windowMinutes: number = 15
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        identifier,
        attempt_type: attemptType,
        max_attempts: maxAttempts,
        window_minutes: windowMinutes
      });
      
      if (error) throw error;
      
      return Boolean(data);
    } catch (error) {
      console.warn('Rate limit check error (allowing attempt by default):', error);
      return true; // Allow on error to prevent blocking login due to RPC issues
    }
  }, []);

  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('validate_user_session');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }, []);

  const logSecurityEvent = useCallback(async (
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
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
      console.warn('Security event logging error (non-blocking):', error);
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