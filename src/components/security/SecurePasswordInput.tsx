import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface SecurePasswordInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  className?: string;
  required?: boolean;
  autoComplete?: string;
}

export function SecurePasswordInput({
  label = "Password",
  placeholder = "Enter your password",
  value,
  onChange,
  onValidationChange,
  className,
  required = false,
  autoComplete = "new-password"
}: SecurePasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);

  const handleValidationChange = useCallback((valid: boolean, errors: string[]) => {
    setIsValid(valid);
    setValidationErrors(errors);
    onValidationChange?.(valid, errors);
  }, [onValidationChange]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="secure-password" className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id="secure-password"
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
          autoComplete={autoComplete}
          required={required}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Password Strength Indicator */}
      <PasswordStrengthIndicator
        password={value}
        onValidationChange={handleValidationChange}
      />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success indicator */}
      {value && isValid && validationErrors.length === 0 && (
        <Alert>
          <AlertDescription className="text-success">
            Password meets all security requirements ✓
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}