import { useState, useCallback } from 'react';
import { useSecurityValidation } from './useSecurityValidation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSecureAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const {
    validateEmail,
    validatePassword,
    sanitizeInput,
    checkRateLimit,
    logSecurityEvent
  } = useSecurityValidation();

  const secureSignIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Validate inputs
      const emailValidation = await validateEmail(email);
      if (!emailValidation.isValid) {
        await logSecurityEvent('failed_login_validation', 'authentication', undefined, {
          reason: 'invalid_email',
          errors: emailValidation.errors
        });
        throw new Error(emailValidation.errors[0]);
      }

      const passwordValidation = await validatePassword(password);
      if (!passwordValidation.isValid) {
        await logSecurityEvent('failed_login_validation', 'authentication', undefined, {
          reason: 'weak_password',
          errors: passwordValidation.errors
        });
        throw new Error('Password does not meet security requirements');
      }

      // Check rate limiting
      const rateLimitOk = await checkRateLimit(email, 'login');
      if (!rateLimitOk) {
        await logSecurityEvent('rate_limit_exceeded', 'authentication', undefined, {
          identifier: email,
          attempt_type: 'login'
        });
        throw new Error('Too many login attempts. Please try again later.');
      }

      // Sanitize email
      const sanitizedEmail = await sanitizeInput(email);

      // Attempt sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        await logSecurityEvent('failed_login', 'authentication', undefined, {
          email: sanitizedEmail,
          error_code: error.message
        });
        throw error;
      }

      // Log successful login
      await logSecurityEvent('successful_login', 'authentication', data.user?.id, {
        email: sanitizedEmail,
        timestamp: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error('Secure sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [validateEmail, validatePassword, sanitizeInput, checkRateLimit, logSecurityEvent]);

  const secureSignUp = useCallback(async (email: string, password: string, userData: any) => {
    setIsLoading(true);
    
    try {
      // Validate inputs
      const emailValidation = await validateEmail(email);
      if (!emailValidation.isValid) {
        await logSecurityEvent('failed_signup_validation', 'authentication', undefined, {
          reason: 'invalid_email',
          errors: emailValidation.errors
        });
        throw new Error(emailValidation.errors[0]);
      }

      const passwordValidation = await validatePassword(password);
      if (!passwordValidation.isValid) {
        await logSecurityEvent('failed_signup_validation', 'authentication', undefined, {
          reason: 'weak_password',
          errors: passwordValidation.errors
        });
        throw new Error(passwordValidation.errors.join(', '));
      }

      // Check rate limiting
      const rateLimitOk = await checkRateLimit(email, 'signup');
      if (!rateLimitOk) {
        await logSecurityEvent('rate_limit_exceeded', 'authentication', undefined, {
          identifier: email,
          attempt_type: 'signup'
        });
        throw new Error('Too many signup attempts. Please try again later.');
      }

      // Sanitize inputs
      const sanitizedEmail = await sanitizeInput(email);
      const sanitizedUserData = {
        first_name: await sanitizeInput(userData.first_name || ''),
        last_name: await sanitizeInput(userData.last_name || ''),
        title: userData.title ? await sanitizeInput(userData.title) : undefined,
        phone: userData.phone ? await sanitizeInput(userData.phone) : undefined,
        department_id: userData.department_id,
        court_position: userData.court_position ? await sanitizeInput(userData.court_position) : undefined,
        emergency_contact: userData.emergency_contact
      };

      // Set redirect URL for email verification
      const redirectUrl = `${window.location.origin}/`;

      // Attempt sign up
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: sanitizedUserData
        }
      });

      if (error) {
        await logSecurityEvent('failed_signup', 'authentication', undefined, {
          email: sanitizedEmail,
          error_code: error.message
        });
        throw error;
      }

      // Log successful signup
      await logSecurityEvent('successful_signup', 'authentication', data.user?.id, {
        email: sanitizedEmail,
        timestamp: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error('Secure sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [validateEmail, validatePassword, sanitizeInput, checkRateLimit, logSecurityEvent]);

  return {
    secureSignIn,
    secureSignUp,
    isLoading
  };
}