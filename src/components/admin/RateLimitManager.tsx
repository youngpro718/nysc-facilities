import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useRateLimitManager } from '@/hooks/security/useRateLimitManager';
import { Shield, RefreshCw, Search, AlertTriangle, CheckCircle } from 'lucide-react';

export function RateLimitManager() {
  const [email, setEmail] = useState('');
  const [statusData, setStatusData] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { 
    isLoading, 
    error, 
    resetLoginAttempts, 
    resetAllAttempts, 
    getRateLimitStatus 
  } = useRateLimitManager();

  const handleCheckStatus = async () => {
    if (!email.trim()) return;
    
    const status = await getRateLimitStatus(email.trim());
    setStatusData(status);
    setSuccessMessage(null);
  };

  const handleResetLogin = async () => {
    if (!email.trim()) return;
    
    const success = await resetLoginAttempts(email.trim());
    if (success) {
      setSuccessMessage(`Login rate limit reset for ${email}`);
      // Refresh status
      handleCheckStatus();
    }
  };

  const handleResetAll = async () => {
    if (!email.trim()) return;
    
    const success = await resetAllAttempts(email.trim());
    if (success) {
      setSuccessMessage(`All rate limits reset for ${email}`);
      // Refresh status
      handleCheckStatus();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Rate Limit Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email to check/reset rate limits"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleCheckStatus}
            disabled={!email.trim() || isLoading}
            variant="outline"
            size="sm"
          >
            <Search className="h-4 w-4 mr-2" />
            Check Status
          </Button>
          
          <Button
            onClick={handleResetLogin}
            disabled={!email.trim() || isLoading}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Login Attempts
          </Button>
          
          <Button
            onClick={handleResetAll}
            disabled={!email.trim() || isLoading}
            variant="destructive"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All Attempts
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Status Display */}
        {statusData.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Rate Limit Status for {email}</h3>
            <div className="space-y-2">
              {statusData.map((status, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {status.attempt_type.replace('_', ' ')}
                    </span>
                    <Badge variant={status.is_blocked ? "destructive" : "secondary"}>
                      {status.is_blocked ? "Blocked" : "Active"}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Attempts: {status.attempts}</div>
                    <div>Last Attempt: {formatDate(status.last_attempt)}</div>
                    {status.blocked_until && (
                      <div>Blocked Until: {formatDate(status.blocked_until)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {statusData.length === 0 && email && !isLoading && !error && (
          <Alert>
            <AlertDescription>
              No rate limit records found for {email}. This means the user hasn't hit any rate limits.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
