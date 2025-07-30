import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Activity, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

interface RateLimit {
  id: string;
  identifier: string;
  attempt_type: string;
  attempts: number;
  first_attempt: string;
  last_attempt: string;
  blocked_until?: string;
}

export function SecurityMonitoring() {
  const { isAdmin } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchSecurityData = async () => {
      try {
        // Fetch recent security events
        const { data: events, error: eventsError } = await supabase
          .from('security_audit_log')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);

        if (eventsError) throw eventsError;

        // Fetch current rate limits
        const { data: limits, error: limitsError } = await supabase
          .from('auth_rate_limits')
          .select('*')
          .order('last_attempt', { ascending: false })
          .limit(20);

        if (limitsError) throw limitsError;

        setSecurityEvents((events || []).map(event => ({
          ...event,
          timestamp: event.created_at,
          ip_address: String(event.ip_address || 'unknown')
        })));
        setRateLimits(limits || []);

        // Check for security alerts
        const newAlerts: string[] = [];
        
        // Check for suspicious activity
        const recentFailedLogins = events?.filter(e => 
          e.action === 'failed_login' && 
          new Date(e.created_at) > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
        ) || [];

        if (recentFailedLogins.length > 10) {
          newAlerts.push(`High number of failed login attempts (${recentFailedLogins.length}) in the last 30 minutes`);
        }

        // Check for rate limit violations
        const activeBlocks = limits?.filter(l => 
          l.blocked_until && new Date(l.blocked_until) > new Date()
        ) || [];

        if (activeBlocks.length > 0) {
          newAlerts.push(`${activeBlocks.length} IP addresses currently blocked due to rate limiting`);
        }

        setAlerts(newAlerts);

        if (newAlerts.length > 0) {
          newAlerts.forEach(alert => {
            toast.error(alert, { duration: 10000 });
          });
        }

      } catch (error) {
        console.error('Error fetching security data:', error);
        toast.error('Failed to load security monitoring data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSecurityData();

    // Set up real-time monitoring
    const interval = setInterval(fetchSecurityData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Access denied. Administrator privileges required.
        </AlertDescription>
      </Alert>
    );
  }

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('failed') || action.includes('blocked')) return 'destructive';
    if (action.includes('successful') || action.includes('approved')) return 'default';
    return 'secondary';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Security Monitoring</h2>
        <Badge variant="outline" className="ml-auto">
          <Activity className="h-3 w-3 mr-1" />
          Live
        </Badge>
      </div>

      {/* Security Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Security Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Security Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading security events...
                </div>
              ) : securityEvents.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No security events found
                </div>
              ) : (
                securityEvents.map((event) => (
                  <div key={event.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={getActionBadgeVariant(event.action)}>
                        {event.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <strong>Resource:</strong> {event.resource_type}
                      {event.resource_id && ` (${event.resource_id})`}
                    </div>
                    {event.ip_address && (
                      <div className="text-xs text-muted-foreground">
                        IP: {event.ip_address}
                      </div>
                    )}
                    {event.details && Object.keys(event.details).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">
                          Details
                        </summary>
                        <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(event.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rate Limit Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Rate Limit Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading rate limit data...
                </div>
              ) : rateLimits.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No rate limit records found
                </div>
              ) : (
                rateLimits.map((limit) => (
                  <div key={limit.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{limit.identifier}</div>
                      <Badge 
                        variant={
                          limit.blocked_until && new Date(limit.blocked_until) > new Date() 
                            ? 'destructive' 
                            : limit.attempts >= 3 
                              ? 'default' 
                              : 'secondary'
                        }
                      >
                        {limit.attempts} attempts
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><strong>Type:</strong> {limit.attempt_type}</div>
                      <div><strong>Last attempt:</strong> {formatTimestamp(limit.last_attempt)}</div>
                      {limit.blocked_until && new Date(limit.blocked_until) > new Date() && (
                        <div className="text-destructive">
                          <strong>Blocked until:</strong> {formatTimestamp(limit.blocked_until)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}