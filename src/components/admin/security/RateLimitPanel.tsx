import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSecuritySettings,
  updateSecuritySettings,
  listBlocked,
  unblockIdentifier,
} from '@/services/security-settings';
import { toast } from 'sonner';
import { Shield, Save, Unlock, AlertTriangle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RateLimitPanel() {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['security-settings'],
    queryFn: getSecuritySettings,
  });

  const { data: blockedList, isLoading: blockedLoading } = useQuery({
    queryKey: ['blocked-identifiers'],
    queryFn: listBlocked,
    // refetchInterval disabled
  });

  const updateMutation = useMutation({
    mutationFn: updateSecuritySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
      toast.success('Rate limit settings updated successfully');
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Failed to update rate limits:', error);
      toast.error('Failed to update rate limit settings');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: unblockIdentifier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-identifiers'] });
      toast.success('Identifier unblocked successfully');
    },
    onError: (error) => {
      console.error('Failed to unblock identifier:', error);
      toast.error('Failed to unblock identifier');
    },
  });

  const [localSettings, setLocalSettings] = useState({
    max_login_attempts: settings?.max_login_attempts ?? 5,
    block_minutes: settings?.block_minutes ?? 30,
    allowed_email_domain: settings?.allowed_email_domain ?? '',
  });

  // Update local settings when data loads
  useState(() => {
    if (settings) {
      setLocalSettings({
        max_login_attempts: settings.max_login_attempts,
        block_minutes: settings.block_minutes,
        allowed_email_domain: settings.allowed_email_domain || '',
      });
    }
  });

  const handleChange = (field: string, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      max_login_attempts: localSettings.max_login_attempts,
      block_minutes: localSettings.block_minutes,
      allowed_email_domain: localSettings.allowed_email_domain || null,
    });
  };

  const handleReset = () => {
    if (settings) {
      setLocalSettings({
        max_login_attempts: settings.max_login_attempts,
        block_minutes: settings.block_minutes,
        allowed_email_domain: settings.allowed_email_domain || '',
      });
      setHasChanges(false);
    }
  };

  const handleUnblock = (identifier: string) => {
    if (confirm(`Are you sure you want to unblock "${identifier}"?`)) {
      unblockMutation.mutate(identifier);
    }
  };

  if (settingsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rate Limiting
          </CardTitle>
          <CardDescription>Configure login attempt limits and blocking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Rate Limiting
        </CardTitle>
        <CardDescription>
          Configure login attempt limits and manage blocked users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Rate limiting protects against brute force attacks by temporarily blocking
            accounts after too many failed login attempts.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="max-attempts">Maximum Login Attempts</Label>
            <Input
              id="max-attempts"
              type="number"
              min="3"
              max="20"
              value={localSettings.max_login_attempts}
              onChange={(e) =>
                handleChange('max_login_attempts', parseInt(e.target.value))
              }
            />
            <p className="text-xs text-muted-foreground">
              Number of failed attempts before blocking (recommended: 5)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="block-duration">Block Duration (minutes)</Label>
            <Input
              id="block-duration"
              type="number"
              min="5"
              max="1440"
              value={localSettings.block_minutes}
              onChange={(e) => handleChange('block_minutes', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              How long to block after max attempts (recommended: 30 minutes)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-domain">Allowed Email Domain (Optional)</Label>
            <Input
              id="email-domain"
              type="text"
              placeholder="example.com"
              value={localSettings.allowed_email_domain}
              onChange={(e) => handleChange('allowed_email_domain', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Restrict signups to specific domain (leave empty for no restriction)
            </p>
          </div>
        </div>

        {hasChanges && (
          <div className="flex gap-2 pt-3 border-t">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={updateMutation.isPending}
            >
              Reset
            </Button>
          </div>
        )}

        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Currently Blocked</h4>
            <Badge variant="secondary">
              {blockedList?.length || 0} blocked
            </Badge>
          </div>

          {blockedLoading ? (
            <div className="text-sm text-muted-foreground">Loading blocked users...</div>
          ) : blockedList && blockedList.length > 0 ? (
            <div className="space-y-2">
              {blockedList.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium">{record.identifier}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Attempts: {record.attempts}</span>
                      {record.blocked_until && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Until: {new Date(record.blocked_until).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnblock(record.identifier)}
                    disabled={unblockMutation.isPending}
                  >
                    <Unlock className="h-4 w-4 mr-1" />
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              No blocked users at this time
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
