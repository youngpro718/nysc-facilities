import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface RateLimitStatus {
  allowed: boolean;
  blocked: boolean;
  attempts: number;
  maxAttempts: number;
  remainingAttempts: number;
  resetTime?: string;
  blockedUntil?: string;
  reason?: string;
}

export function useEnhancedRateLimit() {
  const [isChecking, setIsChecking] = useState(false);

  const checkRateLimit = useCallback(async (
    identifier: string,
    attemptType: string,
    maxAttempts: number = 5,
    windowMinutes: number = 15,
    blockDurationMinutes: number = 60
  ): Promise<RateLimitStatus> => {
    setIsChecking(true);
    
    try {
      const { data, error } = await supabase.rpc('check_enhanced_rate_limit', {
        p_identifier: identifier,
        p_attempt_type: attemptType,
        p_max_attempts: maxAttempts,
        p_window_minutes: windowMinutes,
        p_block_duration_minutes: blockDurationMinutes
      });

      if (error) throw error;

      return data as RateLimitStatus;
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Return permissive default on error to prevent blocking legitimate users
      return {
        allowed: true,
        blocked: false,
        attempts: 0,
        maxAttempts,
        remainingAttempts: maxAttempts,
        reason: 'Rate limit check failed - allowing request'
      };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const checkLoginRateLimit = useCallback(async (email: string): Promise<RateLimitStatus> => {
    return checkRateLimit(email, 'login', 5, 15, 60);
  }, [checkRateLimit]);

  const checkSignupRateLimit = useCallback(async (email: string): Promise<RateLimitStatus> => {
    return checkRateLimit(email, 'signup', 3, 60, 120);
  }, [checkRateLimit]);

  const checkPasswordResetRateLimit = useCallback(async (email: string): Promise<RateLimitStatus> => {
    return checkRateLimit(email, 'password_reset', 3, 60, 60);
  }, [checkRateLimit]);

  return {
    isChecking,
    checkRateLimit,
    checkLoginRateLimit,
    checkSignupRateLimit,
    checkPasswordResetRateLimit
  };
}