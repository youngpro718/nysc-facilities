import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/ThemeProvider';
import { toast } from 'sonner';
import { Bell, Palette, Save, Moon, Sun } from 'lucide-react';
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
    weeklyReports: false,
    compactMode: false,
    showAvatars: true,
  });

  // Load settings from database
  useEffect(() => {
    if (profile) {
      const notifPrefs = profile.notification_preferences || {};
      const interfacePrefs = profile.interface_preferences || {};
      
      setSettings({
        emailNotifications: notifPrefs.email ?? true,
        pushNotifications: notifPrefs.push ?? false,
        criticalAlerts: notifPrefs.critical ?? true,
        weeklyReports: notifPrefs.weekly ?? false,
        compactMode: interfacePrefs.compact ?? false,
        showAvatars: interfacePrefs.showAvatars ?? true,
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
            weekly: settings.weeklyReports,
          },
          interface_preferences: {
            compact: settings.compactMode,
            showAvatars: settings.showAvatars,
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

  const handleChange = (field: string, value: boolean) => {
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
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications and alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notif" className="text-sm font-normal">
                Email Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notif"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                handleChange('emailNotifications', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notif" className="text-sm font-normal">
                Push Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive browser push notifications
              </p>
            </div>
            <Switch
              id="push-notif"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) =>
                handleChange('pushNotifications', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="critical-alerts" className="text-sm font-normal">
                Critical Alerts
              </Label>
              <p className="text-xs text-muted-foreground">
                Instant alerts for critical system events
              </p>
            </div>
            <Switch
              id="critical-alerts"
              checked={settings.criticalAlerts}
              onCheckedChange={(checked) => handleChange('criticalAlerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-reports" className="text-sm font-normal">
                Weekly Reports
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive weekly summary reports
              </p>
            </div>
            <Switch
              id="weekly-reports"
              checked={settings.weeklyReports}
              onCheckedChange={(checked) => handleChange('weeklyReports', checked)}
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
            Customize the look and feel of the interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-select">Theme</Label>
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
              Choose your preferred color scheme
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
