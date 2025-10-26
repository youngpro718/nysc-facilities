import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/providers/ThemeProvider';
import { toast } from 'sonner';
import { Bell, Palette, Save, Moon, Sun, Clock, Shield, Globe, Calendar, LayoutDashboard } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * AdminSettingsPanel - Consolidated admin personal settings
 * 
 * Replaces scattered links with inline controls for:
 * - Notifications preferences
 * - Display/theme settings
 * - Other personal preferences
 */
export default function AdminSettingsPanel() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current user preferences
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences, interface_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Local state for settings
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    criticalAlerts: true,
    compactMode: false,
    showAvatars: true,
    sessionTimeout: '30',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
  });

  // Load settings from database
  useEffect(() => {
    if (profile) {
      const notifPrefs = profile.notification_preferences || {};
      const interfacePrefs = profile.interface_preferences || {};
      const systemPrefs = (profile as any).system_preferences || {};
      
      setSettings({
        emailNotifications: notifPrefs.email ?? true,
        pushNotifications: notifPrefs.push ?? false,
        criticalAlerts: notifPrefs.critical ?? true,
        compactMode: interfacePrefs.compact ?? false,
        showAvatars: interfacePrefs.showAvatars ?? true,
        sessionTimeout: systemPrefs.sessionTimeout ?? '30',
        timezone: systemPrefs.timezone ?? 'America/New_York',
        dateFormat: systemPrefs.dateFormat ?? 'MM/DD/YYYY',
      });
    }
  }, [profile]);

  // Mutation to save settings
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: {
            email: settings.emailNotifications,
            push: settings.pushNotifications,
            critical: settings.criticalAlerts,
          },
          interface_preferences: {
            compact: settings.compactMode,
            showAvatars: settings.showAvatars,
          },
          system_preferences: {
            sessionTimeout: settings.sessionTimeout,
            timezone: settings.timezone,
            dateFormat: settings.dateFormat,
          },
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      toast.success('Settings saved successfully');
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    },
  });

  const handleChange = (field: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleThemeChange = (newTheme: string) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
      toast.success(`Theme changed to ${newTheme}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">Loading settings...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notifications Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure your notification preferences (saved for future use)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> These settings save your preferences but require notification service configuration to be fully functional.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-sm font-normal">
                Email Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive updates and alerts via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications" className="text-sm font-normal">
                Push Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Get instant notifications on your device
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => handleChange('pushNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="critical-alerts" className="text-sm font-normal">
                Critical Alerts
              </Label>
              <p className="text-xs text-muted-foreground">
                Get notified about critical system events
              </p>
            </div>
            <Switch
              id="critical-alerts"
              checked={settings.criticalAlerts}
              onCheckedChange={(checked) => handleChange('criticalAlerts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Display & Appearance
          </CardTitle>
          <CardDescription>
            Customize how the interface looks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="theme-select">Theme</Label>
              <Badge variant="default" className="text-xs bg-green-600">Fully Functional</Badge>
            </div>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme-select">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Changes take effect immediately
            </p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Compact Mode and Show Avatars save your preferences but require UI implementation to be functional.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode" className="text-sm font-normal">
                Compact Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Reduce spacing for more content on screen
              </p>
            </div>
            <Switch
              id="compact-mode"
              checked={settings.compactMode}
              onCheckedChange={(checked) => handleChange('compactMode', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-avatars" className="text-sm font-normal">
                Show Avatars
              </Label>
              <p className="text-xs text-muted-foreground">
                Display user avatars throughout the app
              </p>
            </div>
            <Switch
              id="show-avatars"
              checked={settings.showAvatars}
              onCheckedChange={(checked) => handleChange('showAvatars', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Preferences
          </CardTitle>
          <CardDescription>
            Configure security settings (saved for future use)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> These settings save your preferences but require session management logic to be fully functional.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout</Label>
            <Select 
              value={settings.sessionTimeout} 
              onValueChange={(value) => handleChange('sessionTimeout', value)}
            >
              <SelectTrigger id="session-timeout">
                <SelectValue placeholder="Select timeout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    15 minutes
                  </div>
                </SelectItem>
                <SelectItem value="30">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    30 minutes (default)
                  </div>
                </SelectItem>
                <SelectItem value="60">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    1 hour
                  </div>
                </SelectItem>
                <SelectItem value="120">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    2 hours
                  </div>
                </SelectItem>
                <SelectItem value="240">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    4 hours
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Automatically log out after this period of inactivity
            </p>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-normal">Two-Factor Authentication</Label>
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security to your account with 2FA (feature in development)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regional & Format Preferences
          </CardTitle>
          <CardDescription>
            Set your timezone and date format preferences (saved for future use)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> These settings save your preferences but require date/time formatting logic to be fully functional.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select 
              value={settings.timezone} 
              onValueChange={(value) => handleChange('timezone', value)}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                <SelectItem value="Pacific/Honolulu">Hawaii Time (HST)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All dates and times will be displayed in this timezone
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-format">Date Format</Label>
            <Select 
              value={settings.dateFormat} 
              onValueChange={(value) => handleChange('dateFormat', value)}
            >
              <SelectTrigger id="date-format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    MM/DD/YYYY (US) - 10/26/2025
                  </div>
                </SelectItem>
                <SelectItem value="DD/MM/YYYY">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    DD/MM/YYYY (International) - 26/10/2025
                  </div>
                </SelectItem>
                <SelectItem value="YYYY-MM-DD">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    YYYY-MM-DD (ISO) - 2025-10-26
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose how dates are displayed throughout the app
            </p>
          </div>
        </CardContent>
      </Card>


      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
