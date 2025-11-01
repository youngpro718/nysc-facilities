/**
 * Error Message Component
 * 
 * Displays user-friendly error messages with retry functionality
 * 
 * @component
 */

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorMessageProps {
  error: Error | string;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export function ErrorMessage({ 
  error, 
  onRetry,
  title = 'Error',
  className = '' 
}: ErrorMessageProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {errorMessage}
        </AlertDescription>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4"
          >
            Try Again
          </Button>
        )}
      </Alert>
    </div>
  );
}
