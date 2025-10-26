import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Activity, AlertTriangle, RotateCcw, Clock, Download, Filter, Search, X, Settings } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RateLimitManager } from '@/components/admin/RateLimitManager';

interface SecurityEvent {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  user_id?: string;
  details?: any;
  created_at: string;
}

interface RateLimit {
  id: number;
  identifier: string;
  attempts: number;
  blocked_until?: string;
  attempt_type?: string;
}

interface SecurityAuditPanelProps {
  enableFilters?: boolean;
  enableExport?: boolean;
  pageSize?: number;
}

export function SecurityAuditPanel({ 
  enableFilters = false, 
  enableExport = false, 
  pageSize = 50 
}: SecurityAuditPanelProps = {}) {
  const { isAdmin } = useAuth();
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [activeBlocks, setActiveBlocks] = useState<RateLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showRateLimitManager, setShowRateLimitManager] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    searchText: '',
    resourceType: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const handleUnblock = async (identifier: string, attemptType?: string) => {
    try {
      const { error } = await supabase.rpc('reset_rate_limit', {
        p_identifier: identifier,
        p_attempt_type: attemptType || 'login'
      });

      if (error) throw error;

      toast.success(`Unblocked ${identifier}`);
      fetchSecurityData(); // Refresh the list
    } catch (error) {
      console.error('Failed to unblock user:', error);
      toast.error('Failed to unblock user');
    }
  };

  const fetchSecurityData = async () => {
    if (!isAdmin) return;

    try {
      setIsLoading(true);

      // Build query with filters
      let query = supabase
        .from('security_audit_log')
        .select('id, action, resource_type, resource_id, user_id, details, created_at')
        .order('created_at', { ascending: false });

      // Apply filters if enabled
      if (enableFilters) {
        if (filters.searchText) {
          query = query.or(`action.ilike.%${filters.searchText}%,resource_id.ilike.%${filters.searchText}%`);
        }
        if (filters.resourceType !== 'all') {
          query = query.eq('resource_type', filters.resourceType);
        }
        if (filters.dateFrom) {
          query = query.gte('created_at', new Date(filters.dateFrom).toISOString());
        }
        if (filters.dateTo) {
          query = query.lte('created_at', new Date(filters.dateTo + 'T23:59:59').toISOString());
        }
        query = query.limit(pageSize);
      } else {
        // Default behavior: only failed/blocked events, limit 10
        query = query
          .or('action.ilike.%failed%,action.ilike.%blocked%')
          .limit(10);
      }

      const { data: events, error: eventsError } = await query;

      if (eventsError) {
        console.error('Events error:', eventsError);
      }

      // Fetch only currently blocked users
      const { data: limits, error: limitsError } = await supabase
        .from('security_rate_limits')
        .select('id, identifier, attempts, blocked_until, attempt_type')
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
  }, [isAdmin, filters]);

  const handleExport = () => {
    if (recentEvents.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      // Convert to CSV
      const headers = ['Timestamp', 'Action', 'Resource Type', 'Resource ID', 'User ID'];
      const rows = recentEvents.map(event => [
        new Date(event.created_at).toISOString(),
        event.action,
        event.resource_type,
        event.resource_id || '',
        event.user_id || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `security-audit-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Audit log exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export audit log');
    }
  };

  const clearFilters = () => {
    setFilters({
      searchText: '',
      resourceType: 'all',
      dateFrom: '',
      dateTo: '',
    });
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security {enableFilters ? 'Audit Log' : 'Overview'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {enableFilters 
              ? 'Comprehensive security event log with filtering and export'
              : 'Monitor failed login attempts and blocked users'}
          </p>
        </div>
        <div className="flex gap-2">
          {enableFilters && (
            <Button 
              onClick={() => setShowFilters(!showFilters)} 
              variant="outline" 
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          )}
          {enableExport && (
            <Button 
              onClick={handleExport} 
              variant="outline" 
              size="sm"
              disabled={recentEvents.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
          <Button onClick={fetchSecurityData} disabled={isLoading} size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {enableFilters && showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Filters
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search action or resource..."
                  value={filters.searchText}
                  onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-type">Resource Type</Label>
                <Select
                  value={filters.resourceType}
                  onValueChange={(value) => setFilters({ ...filters, resourceType: value })}
                >
                  <SelectTrigger id="resource-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="security_settings">Security Settings</SelectItem>
                    <SelectItem value="security_rate_limits">Rate Limits</SelectItem>
                    <SelectItem value="profiles">Profiles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Blocked Users</CardTitle>
                <CardDescription>Users currently blocked from authentication</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRateLimitManager(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Advanced
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeBlocks.map((limit) => (
                <div key={limit.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{limit.identifier}</p>
                    <p className="text-xs text-muted-foreground">{limit.attempts} failed attempts</p>
                    {limit.blocked_until && (
                      <p className="text-xs text-muted-foreground">
                        Until: {new Date(limit.blocked_until).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="destructive">Blocked</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnblock(limit.identifier, limit.attempt_type)}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Unblock
                    </Button>
                  </div>
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

      {/* Rate Limit Manager Dialog */}
      <Dialog open={showRateLimitManager} onOpenChange={setShowRateLimitManager}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Rate Limit Manager</DialogTitle>
            <DialogDescription>
              Advanced tools for checking and resetting rate limits
            </DialogDescription>
          </DialogHeader>
          <RateLimitManager />
        </DialogContent>
      </Dialog>
    </div>
  );
}