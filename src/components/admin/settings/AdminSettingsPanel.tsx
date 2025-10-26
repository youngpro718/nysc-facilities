import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { toast } from 'sonner';
import { Bell, Palette, Save, Moon, Sun } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [hasChanges, setHasChanges] = useState(false);

  // Local state for settings
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    criticalAlerts: true,
    weeklyReports: false,
    compactMode: false,
    showAvatars: true,
  });

  const handleChange = (field: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // In production, save to database
    toast.success('Settings saved successfully');
    setHasChanges(false);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system');
    toast.success(`Theme changed to ${newTheme}`);
  };

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
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    System
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
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
