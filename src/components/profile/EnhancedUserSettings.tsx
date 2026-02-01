import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/providers/ThemeProvider';
import { useEnhancedTheme } from '@/providers/EnhancedThemeProvider';
import {
  Bell,
  Mail,
  Smartphone,
  Shield,
  Eye,
  Clock,
  Globe,
  Palette,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  Settings,
  User,
  Calendar,
  MapPin,
  Phone,
  Languages,
  Accessibility,
  Download,
  RefreshCw
} from 'lucide-react';

interface UserSettings {
  // Notification Settings
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  desktop_notifications: boolean;
  notification_sound: boolean;
  notification_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  
  // Privacy Settings
  profile_visibility: 'public' | 'private' | 'contacts_only';
  show_online_status: boolean;
  allow_contact_requests: boolean;
  data_sharing_analytics: boolean;
  data_sharing_marketing: boolean;
  
  // Appearance Settings
  theme: 'light' | 'dark' | 'system';
  color_scheme: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  compact_mode: boolean;
  high_contrast: boolean;
  font_size: 'small' | 'medium' | 'large';
  
  // Language & Region
  language: 'en' | 'es' | 'fr';
  timezone: string;
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  time_format: '12h' | '24h';
  
  // Security Settings
  two_factor_enabled: boolean;
  session_timeout: number;
  login_notifications: boolean;
  device_tracking: boolean;
  
  // Accessibility Settings
  screen_reader_support: boolean;
  keyboard_navigation: boolean;
  motion_reduced: boolean;
  text_to_speech: boolean;
}

const defaultSettings: UserSettings = {
  email_notifications: true,
  push_notifications: true,
  sms_notifications: false,
  desktop_notifications: true,
  notification_sound: true,
  notification_frequency: 'immediate',
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  profile_visibility: 'contacts_only',
  show_online_status: true,
  allow_contact_requests: true,
  data_sharing_analytics: false,
  data_sharing_marketing: false,
  theme: 'system',
  color_scheme: 'blue',
  compact_mode: false,
  high_contrast: false,
  font_size: 'medium',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  date_format: 'MM/DD/YYYY',
  time_format: '12h',
  two_factor_enabled: false,
  session_timeout: 30,
  login_notifications: true,
  device_tracking: true,
  screen_reader_support: false,
  keyboard_navigation: false,
  motion_reduced: false,
  text_to_speech: false,
};

export function EnhancedUserSettings() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const { updateSettings: updateEnhancedTheme } = useEnhancedTheme();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use 'settingsTab' to avoid conflict with Profile page's 'tab' parameter
  const rawTab = searchParams.get('settingsTab') ?? 'notifications';
  const mapToCanonical = (t: string) => {
    if (t === 'appearance' || t === 'language') return 'display';
    if (t === 'privacy') return 'security';
    // Return 'notifications' as default for invalid values
    if (!['notifications', 'display', 'security', 'accessibility'].includes(t)) return 'notifications';
    return t;
  };
  const initialTab = mapToCanonical(rawTab);
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  useEffect(() => {
    const nextRaw = searchParams.get('settingsTab') ?? 'notifications';
    setActiveTab(mapToCanonical(nextRaw));
  }, [searchParams]);

  // Apply display-related settings immediately (theme/font size/density/accessibility)
  // so the Settings tab isn't just "placeholders".
  useEffect(() => {
    if (isLoading) return;

    updateEnhancedTheme({
      variant: settings.theme,
      fontSize: settings.font_size,
      layoutDensity: settings.compact_mode ? 'compact' : 'comfortable',
      reducedMotion: settings.motion_reduced,
      highContrast: settings.high_contrast,
    });

    const resolvedTheme =
      settings.theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : settings.theme;
    setTheme(resolvedTheme);
  }, [
    isLoading,
    settings.theme,
    settings.font_size,
    settings.compact_mode,
    settings.motion_reduced,
    settings.high_contrast,
    setTheme,
    updateEnhancedTheme,
  ]);

  const loadSettings = async () => {
    if (!user?.id) {
      // Prevent an infinite loading state if auth isn't available yet.
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({ ...defaultSettings, ...(data as any).user_settings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      // Persist only the simplified schema
      const minimalSettings = {
        email_notifications: settings.email_notifications,
        desktop_notifications: settings.desktop_notifications,
        notification_frequency: settings.notification_frequency === 'weekly' || settings.notification_frequency === 'hourly' ? 'daily' : settings.notification_frequency,
        theme: settings.theme,
        font_size: settings.font_size,
        language: settings.language,
        timezone: settings.timezone,
        date_format: settings.date_format,
        time_format: settings.time_format,
        two_factor_enabled: settings.two_factor_enabled,
        login_notifications: settings.login_notifications,
        session_timeout: settings.session_timeout,
        high_contrast: settings.high_contrast,
        screen_reader_support: settings.screen_reader_support,
        keyboard_navigation: settings.keyboard_navigation,
        motion_reduced: settings.motion_reduced,
        data_sharing_analytics: settings.data_sharing_analytics,
      } as Partial<UserSettings>;

      const { error } = await supabase
        .from('profiles')
        .update({
          user_settings: minimalSettings as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setHasChanges(false);
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults",
    });
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'user-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Settings Exported",
      description: "Your settings have been exported successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Settings</h1>
          <p className="text-muted-foreground">Customize your experience and preferences</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={resetSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={saveSettings} 
            disabled={!hasChanges || isSaving}
            className="min-w-[100px]"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                Saving...
              </div>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Card className="border-border bg-muted/40">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">You have unsaved changes</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          const next = new URLSearchParams(searchParams);
          next.set('settingsTab', v);
          setSearchParams(next, { replace: true });
        }}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Display</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2">
            <Accessibility className="h-4 w-4" />
            <span className="hidden sm:inline">Accessibility</span>
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab (trimmed) */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(value) => updateSetting('email_notifications', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Desktop Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">Show browser notifications</p>
                  </div>
                  <Switch
                    checked={settings.desktop_notifications}
                    onCheckedChange={(value) => updateSetting('desktop_notifications', value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label>Notification Frequency</Label>
                  <Select
                    value={settings.notification_frequency}
                    onValueChange={(value: any) => updateSetting('notification_frequency', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Data</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Analytics Data</Label>
                    <p className="text-sm text-muted-foreground">Help improve the app with usage analytics</p>
                  </div>
                  <Switch
                    checked={settings.data_sharing_analytics}
                    onCheckedChange={(value) => updateSetting('data_sharing_analytics', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Tab (Appearance + Language) - trimmed */}
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Display Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value: any) => updateSetting('theme', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
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
                          <Monitor className="h-4 w-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Font Size</Label>
                  <Select
                    value={settings.font_size}
                    onValueChange={(value: any) => updateSetting('font_size', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label>Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value: any) => updateSetting('language', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date Format</Label>
                  <Select
                    value={settings.date_format}
                    onValueChange={(value: any) => updateSetting('date_format', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Time Format</Label>
                  <Select
                    value={settings.time_format}
                    onValueChange={(value: any) => updateSetting('time_format', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Two-Factor Authentication
                    </Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={settings.two_factor_enabled}
                    onCheckedChange={(value) => updateSetting('two_factor_enabled', value)}
                  />
                </div>

                {isAdmin && (
                  <div>
                    <Label>Session Timeout (minutes)</Label>
                    <Select
                      value={settings.session_timeout.toString()}
                      onValueChange={(value) => {
                        const n = Number(value);
                        if (Number.isFinite(n) && !Number.isNaN(n)) {
                          updateSetting('session_timeout', n as any);
                        } else {
                          // Gracefully handle invalid input (shouldn't occur with Select)
                          // Optionally notify the user
                          // toast({ title: 'Invalid timeout value', variant: 'destructive' });
                        }
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="60">60</SelectItem>
                        <SelectItem value="120">120</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new logins</p>
                  </div>
                  <Switch
                    checked={settings.login_notifications}
                    onCheckedChange={(value) => updateSetting('login_notifications', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accessibility Tab */}
        <TabsContent value="accessibility" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Accessibility className="h-5 w-5" />
                Accessibility Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Accessibility className="h-4 w-4" />
                      Screen Reader Support
                    </Label>
                    <p className="text-sm text-muted-foreground">Optimize interface for screen readers</p>
                  </div>
                  <Switch
                    checked={settings.screen_reader_support}
                    onCheckedChange={(value) => updateSetting('screen_reader_support', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Keyboard Navigation</Label>
                    <p className="text-sm text-muted-foreground">Enhanced keyboard navigation support</p>
                  </div>
                  <Switch
                    checked={settings.keyboard_navigation}
                    onCheckedChange={(value) => updateSetting('keyboard_navigation', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reduce Motion</Label>
                    <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                  </div>
                  <Switch
                    checked={settings.motion_reduced}
                    onCheckedChange={(value) => updateSetting('motion_reduced', value)}
                  />
                </div>

                {/* Text-to-Speech removed for now */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>
    </div>
  );
}
