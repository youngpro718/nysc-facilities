import { useState, useCallback } from 'react';
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

interface RateLimitStatus {
  identifier: string;
  attempt_type: string;
  attempts: number;
  last_attempt: string;
  blocked_until: string | null;
  is_blocked: boolean;
}

export function useRateLimitManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetRateLimit = useCallback(async (
    identifier: string, 
    attemptType?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('reset_rate_limit', {
        p_identifier: identifier,
        p_attempt_type: attemptType || null
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      logger.error('Rate limit reset error:', error);
      setError(getErrorMessage(error) || 'Failed to reset rate limit');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRateLimitStatus = useCallback(async (
    identifier: string,
    attemptType?: string
  ): Promise<RateLimitStatus[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_rate_limit_status', {
        p_identifier: identifier,
        p_attempt_type: attemptType || null
      });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      logger.error('Rate limit status error:', error);
      setError(getErrorMessage(error) || 'Failed to get rate limit status');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetLoginAttempts = useCallback(async (email: string): Promise<boolean> => {
    return resetRateLimit(email, 'login');
  }, [resetRateLimit]);

  const resetSignupAttempts = useCallback(async (email: string): Promise<boolean> => {
    return resetRateLimit(email, 'signup');
  }, [resetRateLimit]);

  const resetAllAttempts = useCallback(async (email: string): Promise<boolean> => {
    return resetRateLimit(email);
  }, [resetRateLimit]);

  return {
    isLoading,
    error,
    resetRateLimit,
    getRateLimitStatus,
    resetLoginAttempts,
    resetSignupAttempts,
    resetAllAttempts
  };
}
