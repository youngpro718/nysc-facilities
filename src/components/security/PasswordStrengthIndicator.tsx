import { useCallback, useMemo } from 'react';
import { useSecurityValidation } from '@/hooks/security/useSecurityValidation';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

export function PasswordStrengthIndicator({ 
  password, 
  onValidationChange 
}: PasswordStrengthIndicatorProps) {
  const { validatePassword, isValidating } = useSecurityValidation();

  // Calculate password strength score based on criteria
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, criteria: [] };

    const criteria = [
      { label: 'At least 12 characters', test: password.length >= 12 },
      { label: 'Contains uppercase letter', test: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', test: /[a-z]/.test(password) },
      { label: 'Contains number', test: /[0-9]/.test(password) },
      { label: 'Contains special character', test: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
      { label: 'Not a common password', test: !['password123', '123456789012', 'qwertyuiop12'].includes(password.toLowerCase()) }
    ];

    const score = criteria.filter(c => c.test).length;
    return { score, criteria };
  }, [password]);

  // Validate password on change
  const handleValidation = useCallback(async () => {
    if (!password) {
      onValidationChange?.(false, []);
      return;
    }

    try {
      const result = await validatePassword(password);
      onValidationChange?.(result.isValid, result.errors);
    } catch (error) {
      console.error('Password validation error:', error);
      onValidationChange?.(false, ['Password validation failed']);
    }
  }, [password, validatePassword, onValidationChange]);

  // Trigger validation when password changes
  useMemo(() => {
    if (password) {
      handleValidation();
    }
  }, [password, handleValidation]);

  const getStrengthColor = (score: number) => {
    if (score <= 2) return 'bg-destructive';
    if (score <= 4) return 'bg-warning';
    return 'bg-success';
  };

  const getStrengthText = (score: number) => {
    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Strength Meter */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Password Strength</span>
          <span className={`text-sm font-medium ${
            passwordStrength.score <= 2 ? 'text-destructive' :
            passwordStrength.score <= 4 ? 'text-warning' : 'text-success'
          }`}>
            {getStrengthText(passwordStrength.score)}
          </span>
        </div>
        <Progress 
          value={(passwordStrength.score / 6) * 100} 
          className={`h-2 ${getStrengthColor(passwordStrength.score)}`}
        />
      </div>

      {/* Criteria Checklist */}
      <div className="space-y-1">
        {passwordStrength.criteria.map((criterion, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {criterion.test ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={criterion.test ? 'text-foreground' : 'text-muted-foreground'}>
              {criterion.label}
            </span>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {isValidating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 animate-spin" />
          <span>Validating password security...</span>
        </div>
      )}
    </div>
  );
}