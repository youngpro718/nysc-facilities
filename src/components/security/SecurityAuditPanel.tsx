import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Activity, Users, AlertTriangle, RotateCcw } from 'lucide-react';
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
  created_at: string;
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

export function SecurityAuditPanel() {
  const { isAdmin } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSecurityData = async () => {
    if (!isAdmin) return;

    try {
      setIsLoading(true);

      // Fetch recent security events
      const { data: events, error: eventsError } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) throw eventsError;

      // Fetch rate limit data
      const { data: limits, error: limitsError } = await supabase
        .from('auth_rate_limits')
        .select('*')
        .order('last_attempt', { ascending: false })
        .limit(20);

      if (limitsError) throw limitsError;

      setSecurityEvents((events || []).map(event => ({
        ...event,
        ip_address: String(event.ip_address || 'unknown')
      })));
      setRateLimits(limits || []);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      toast.error('Failed to load security audit data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [isAdmin]);

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('failed') || action.includes('blocked')) return 'destructive';
    if (action.includes('role') || action.includes('admin')) return 'default';
    return 'secondary';
  };

  const getAttemptsBadgeVariant = (attempts: number, blockedUntil?: string) => {
    if (blockedUntil && new Date(blockedUntil) > new Date()) return 'destructive';
    if (attempts >= 3) return 'destructive';
    if (attempts >= 2) return 'secondary';
    return 'default';
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5" />
            <p>Access denied. Admin privileges required.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Audit Panel
          </h2>
          <p className="text-muted-foreground">Monitor security events and authentication attempts</p>
        </div>
        <Button onClick={fetchSecurityData} disabled={isLoading}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Security Events
            </CardTitle>
            <CardDescription>
              Latest security-related actions and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {securityEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No security events found</p>
              ) : (
                <div className="space-y-3">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={getActionBadgeVariant(event.action)}>
                          {event.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{event.resource_type}</p>
                      {event.details && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(event.details, null, 2)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Rate Limit Status
            </CardTitle>
            <CardDescription>
              Authentication attempt monitoring and rate limiting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {rateLimits.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No rate limit data found</p>
              ) : (
                <div className="space-y-3">
                  {rateLimits.map((limit) => (
                    <div key={limit.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={getAttemptsBadgeVariant(limit.attempts, limit.blocked_until)}>
                          {limit.attempts} attempts
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {limit.attempt_type}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{limit.identifier}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        <p>Last: {new Date(limit.last_attempt).toLocaleString()}</p>
                        {limit.blocked_until && new Date(limit.blocked_until) > new Date() && (
                          <p className="text-destructive font-medium">
                            Blocked until: {new Date(limit.blocked_until).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}