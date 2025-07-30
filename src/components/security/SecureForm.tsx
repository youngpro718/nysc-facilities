import React, { useState, useCallback } from 'react';
import { useSecurityValidation } from '@/hooks/security/useSecurityValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield } from 'lucide-react';

interface SecureFormProps {
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
  title: string;
  submitText: string;
}

export function SecureForm({ onSubmit, isLoading = false, title, submitText }: SecureFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  const { 
    validateEmail, 
    validatePassword, 
    sanitizeInput, 
    checkRateLimit,
    logSecurityEvent
  } = useSecurityValidation();

  const handleEmailChange = useCallback(async (value: string) => {
    const sanitized = await sanitizeInput(value);
    setEmail(sanitized);
    setErrors([]);
  }, [sanitizeInput]);

  const handlePasswordChange = useCallback(async (value: string) => {
    setPassword(value);
    setErrors([]);
  }, []);

  const validateForm = useCallback(async () => {
    setIsValidating(true);
    const allErrors: string[] = [];

    try {
      // Check rate limit first
      const rateLimitOk = await checkRateLimit(email, 'login');
      if (!rateLimitOk) {
        setIsRateLimited(true);
        allErrors.push('Too many attempts. Please try again later.');
        return allErrors;
      }

      // Validate email
      const emailValidation = await validateEmail(email);
      if (!emailValidation.isValid) {
        allErrors.push(...emailValidation.errors);
      }

      // Validate password for signup forms (if this is a strong password requirement)
      if (title.toLowerCase().includes('sign up') || title.toLowerCase().includes('register')) {
        const passwordValidation = await validatePassword(password);
        if (!passwordValidation.isValid) {
          allErrors.push(...passwordValidation.errors);
        }
      }

      return allErrors;
    } finally {
      setIsValidating(false);
    }
  }, [email, password, title, validateEmail, validatePassword, checkRateLimit]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRateLimited) {
      setErrors(['Rate limit exceeded. Please try again later.']);
      return;
    }

    const validationErrors = await validateForm();
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      await logSecurityEvent('form_validation_failed', 'authentication', undefined, {
        email,
        errors: validationErrors
      });
      return;
    }

    try {
      await onSubmit({ email, password });
      await logSecurityEvent('form_submitted', 'authentication', undefined, { email });
    } catch (error) {
      await logSecurityEvent('form_submission_failed', 'authentication', undefined, {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, [email, password, validateForm, onSubmit, logSecurityEvent, isRateLimited]);

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg border">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isRateLimited && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Too many failed attempts. Please wait before trying again.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isLoading || isValidating || isRateLimited}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={isLoading || isValidating || isRateLimited}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || isValidating || isRateLimited || !email || !password}
        >
          {(isLoading || isValidating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isValidating ? 'Validating...' : submitText}
        </Button>
      </form>
    </div>
  );
}