import React, { useState, useCallback, useEffect } from 'react';
import { useSecurityValidation } from '@features/auth/hooks/useSecurityValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield } from 'lucide-react';
interface SecureFormProps {
  onSubmit: (data: {
    email: string;
    password: string;
  }) => Promise<void>;
  isLoading?: boolean;
  title: string;
  submitText: string;
  defaultEmail?: string;
}
export function SecureForm({
  onSubmit,
  isLoading = false,
  title,
  submitText,
  defaultEmail
}: SecureFormProps) {
  const [email, setEmail] = useState(defaultEmail || '');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const {
    validateEmail,
    validatePassword,
    sanitizeInput,
    logSecurityEvent
  } = useSecurityValidation();
  const handleEmailChange = useCallback((value: string) => {
    // Set email immediately for responsive typing
    setEmail(value);
    setErrors([]);
    // Sanitization will happen on form submit
  }, []);
  const handlePasswordChange = useCallback(async (value: string) => {
    setPassword(value);
    setErrors([]);
  }, []);
  const validateForm = useCallback(async () => {
    setIsValidating(true);
    const allErrors: string[] = [];
    try {
      // NOTE: no rate-limit check here. check_rate_limit INCREMENTS the attempt
      // counter, and secureSignIn already performs the authoritative check —
      // checking here too burned 2 attempts per login click.

      // Validate email
      const emailValidation = await validateEmail(email);
      if (!emailValidation.isValid) {
        allErrors.push(...emailValidation.errors);
      }

      // Skip password validation for login - let the backend handle it
      // Only validate passwords for signup forms
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
  }, [email, password, title, validateEmail, validatePassword]);
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRateLimited) {
      setErrors(['Rate limit exceeded. Please try again later.']);
      return;
    }
    
    // Sanitize inputs before validation
    const sanitizedEmail = await sanitizeInput(email);
    setEmail(sanitizedEmail);
    
    const validationErrors = await validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      await logSecurityEvent('form_validation_failed', 'authentication', undefined, {
        email: sanitizedEmail,
        errors: validationErrors
      });
      return;
    }
    try {
      await onSubmit({
        email: sanitizedEmail,
        password
      });
      await logSecurityEvent('form_submitted', 'authentication', undefined, {
        email: sanitizedEmail
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      // Reflect lockouts thrown by secureSignIn in the form UI
      if (/too many login attempts|temporarily locked/i.test(message)) {
        setIsRateLimited(true);
      }
      await logSecurityEvent('form_submission_failed', 'authentication', undefined, {
        email: sanitizedEmail,
        error: message
      });
      throw error;
    }
  }, [email, password, validateForm, onSubmit, logSecurityEvent, isRateLimited, sanitizeInput]);
  return <div className="max-w-md mx-auto p-0">
      <div className="mb-4 space-y-1">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>
        {title.toLowerCase().includes('sign in') && (
          <p className="text-sm text-slate-600">Sign in to continue</p>
        )}
      </div>

      {errors.length > 0 && <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => <li key={index}>{error}</li>)}
            </ul>
          </AlertDescription>
        </Alert>}

      {isRateLimited && <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Too many failed attempts. Please wait before trying again.
          </AlertDescription>
        </Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={e => handleEmailChange(e.target.value)} placeholder="Enter your email" required disabled={isLoading || isValidating || isRateLimited} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={e => handlePasswordChange(e.target.value)} placeholder="Enter your password" required disabled={isLoading || isValidating || isRateLimited} />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || isValidating || isRateLimited || !email || !password}>
          {(isLoading || isValidating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isValidating ? 'Validating...' : submitText}
        </Button>
      </form>
    </div>;
}
