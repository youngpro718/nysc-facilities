import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSecuritySettings, updateSecuritySettings } from '@/services/security-settings';
import { toast } from 'sonner';
import { Shield, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PasswordPolicyPanel() {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['security-settings'],
    queryFn: getSecuritySettings,
  });

  const mutation = useMutation({
    mutationFn: updateSecuritySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
      toast.success('Password policy updated successfully');
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Failed to update password policy:', error);
      toast.error('Failed to update password policy');
    },
  });

  const [localSettings, setLocalSettings] = useState({
    password_min_length: settings?.password_min_length ?? 12,
    password_require_upper: settings?.password_require_upper ?? true,
    password_require_lower: settings?.password_require_lower ?? true,
    password_require_digit: settings?.password_require_digit ?? true,
    password_require_symbol: settings?.password_require_symbol ?? true,
  });

  // Update local settings when data loads
  useState(() => {
    if (settings) {
      setLocalSettings({
        password_min_length: settings.password_min_length,
        password_require_upper: settings.password_require_upper,
        password_require_lower: settings.password_require_lower,
        password_require_digit: settings.password_require_digit,
        password_require_symbol: settings.password_require_symbol,
      });
    }
  });

  const handleChange = (field: string, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    mutation.mutate(localSettings);
  };

  const handleReset = () => {
    if (settings) {
      setLocalSettings({
        password_min_length: settings.password_min_length,
        password_require_upper: settings.password_require_upper,
        password_require_lower: settings.password_require_lower,
        password_require_digit: settings.password_require_digit,
        password_require_symbol: settings.password_require_symbol,
      });
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Password Policy
          </CardTitle>
          <CardDescription>Configure password requirements</CardDescription>
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
          Password Policy
        </CardTitle>
        <CardDescription>Configure password requirements for all users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Changes will apply to new passwords only. Existing users won't be forced to
            change their passwords unless they reset them.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="min-length">Minimum Password Length</Label>
            <Input
              id="min-length"
              type="number"
              min="8"
              max="128"
              value={localSettings.password_min_length}
              onChange={(e) =>
                handleChange('password_min_length', parseInt(e.target.value))
              }
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 12 or more characters
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <Label>Character Requirements</Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-upper" className="text-sm font-normal">
                  Require Uppercase Letters
                </Label>
                <p className="text-xs text-muted-foreground">At least one A-Z</p>
              </div>
              <Switch
                id="require-upper"
                checked={localSettings.password_require_upper}
                onCheckedChange={(checked) =>
                  handleChange('password_require_upper', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-lower" className="text-sm font-normal">
                  Require Lowercase Letters
                </Label>
                <p className="text-xs text-muted-foreground">At least one a-z</p>
              </div>
              <Switch
                id="require-lower"
                checked={localSettings.password_require_lower}
                onCheckedChange={(checked) =>
                  handleChange('password_require_lower', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-digit" className="text-sm font-normal">
                  Require Numbers
                </Label>
                <p className="text-xs text-muted-foreground">At least one 0-9</p>
              </div>
              <Switch
                id="require-digit"
                checked={localSettings.password_require_digit}
                onCheckedChange={(checked) =>
                  handleChange('password_require_digit', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-symbol" className="text-sm font-normal">
                  Require Special Characters
                </Label>
                <p className="text-xs text-muted-foreground">At least one !@#$%^&*</p>
              </div>
              <Switch
                id="require-symbol"
                checked={localSettings.password_require_symbol}
                onCheckedChange={(checked) =>
                  handleChange('password_require_symbol', checked)
                }
              />
            </div>
          </div>
        </div>

        {hasChanges && (
          <div className="flex gap-2 pt-3 border-t">
            <Button
              onClick={handleSave}
              disabled={mutation.isPending}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={mutation.isPending}
            >
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
