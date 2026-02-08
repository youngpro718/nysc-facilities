import React from 'react';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundary } from './ErrorBoundary';

interface AuthErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
}

function AuthErrorFallback({ error, onRetry }: AuthErrorFallbackProps) {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {error?.message || 'There was a problem with authentication. Please try signing in again.'}
          </p>
          
          <div className="flex gap-2">
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline" 
                className="flex-1"
              >
                Try Again
              </Button>
            )}
            <Button 
              onClick={handleGoToLogin} 
              className="flex-1"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

export function AuthErrorBoundary({ children, onError }: AuthErrorBoundaryProps) {
  const handleError = (error: Error) => {
    // Handle cases where error might not be a proper Error object
    const errorMessage = error?.message || String(error) || 'Unknown error';
    
    // Only handle actual authentication-related errors
    const isAuthError = errorMessage.includes('auth') || 
                       errorMessage.includes('Authentication') ||
                       errorMessage.includes('session') ||
                       errorMessage.includes('token') ||
                       errorMessage.includes('login') ||
                       errorMessage.includes('unauthorized');
    
    if (isAuthError) {
      logger.error('AuthErrorBoundary: Authentication error caught:', error);
      onError?.(error);
    } else {
      // For non-auth errors, just log and re-throw to let other error boundaries handle them
      logger.error('AuthErrorBoundary: Non-auth error, re-throwing:', error);
      
      // If error is not a proper Error object, create a proper one
      if (!(error instanceof Error)) {
        throw new Error(`Non-Error object thrown: ${JSON.stringify(error)}`);
      }
      
      throw error;
    }
  };

  return (
    <ErrorBoundary
      fallback={<AuthErrorFallback />}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}

export default AuthErrorBoundary;