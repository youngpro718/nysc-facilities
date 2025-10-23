import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Activity, AlertTriangle, RotateCcw, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  action: string;
  resource_type: string;
  created_at: string;
}

interface RateLimit {
  id: number;
  identifier: string;
  attempts: number;
  blocked_until?: string;
}

export function SecurityAuditPanel() {
  const { isAdmin } = useAuth();
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [activeBlocks, setActiveBlocks] = useState<RateLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const fetchSecurityData = async () => {
    if (!isAdmin) return;

    try {
      setIsLoading(true);

      // Fetch only recent failed/blocked events (last 10)
      const { data: events, error: eventsError } = await supabase
        .from('security_audit_log')
        .select('id, action, resource_type, created_at')
        .or('action.ilike.%failed%,action.ilike.%blocked%')
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsError) {
        console.error('Events error:', eventsError);
      }

      // Fetch only currently blocked users
      const { data: limits, error: limitsError } = await supabase
        .from('security_rate_limits')
        .select('id, identifier, attempts, blocked_until')
        .not('blocked_until', 'is', null)
        .gte('blocked_until', new Date().toISOString())
        .limit(10);

      if (limitsError) {
        console.error('Limits error:', limitsError);
      }

      setRecentEvents(events || []);
      setActiveBlocks(limits || []);
      setLastRefreshedAt(new Date());
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [isAdmin]);


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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </h2>
          <p className="text-sm text-muted-foreground">Monitor failed login attempts and blocked users</p>
        </div>
        <Button onClick={fetchSecurityData} disabled={isLoading} size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Failed Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 10 failed or blocked events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Currently Blocked Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBlocks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Users temporarily blocked from logging in
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Failed Events */}
      {recentEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Failed Events</CardTitle>
            <CardDescription>Last 10 failed or blocked security events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.action}</p>
                    <p className="text-xs text-muted-foreground">{event.resource_type}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Blocks */}
      {activeBlocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Blocked Users</CardTitle>
            <CardDescription>Users currently blocked from authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeBlocks.map((limit) => (
                <div key={limit.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{limit.identifier}</p>
                    <p className="text-xs text-muted-foreground">{limit.attempts} failed attempts</p>
                  </div>
                  <Badge variant="destructive">Blocked</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {recentEvents.length === 0 && activeBlocks.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No security issues detected</p>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString() : 'Never'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5 animate-spin" />
              <p className="text-muted-foreground">Loading security data...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}