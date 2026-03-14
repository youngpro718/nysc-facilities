// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Loader2 } from "lucide-react";
import { logger } from '@/lib/logger';
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
import { useTheme, useEnhancedTheme } from '@/providers/EnhancedThemeProvider';
import {
  Bell,
  Mail,
  Smartphone,
  Shield,
  Eye,
  EyeOff,
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
  RefreshCw,
  Bot,
  Trash2
} from 'lucide-react';
import { MyRoomSection } from './MyRoomSection';

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoading,
    settings.theme,
    settings.font_size,
    settings.compact_mode,
    settings.motion_reduced,
    settings.high_contrast,
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
        setSettings({ ...defaultSettings, ...((data as Record<string, unknown>)).user_settings });
      }
    } catch (error) {
      logger.error('Error loading settings:', error);
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
          user_settings: minimalSettings as unknown,
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
      logger.error('Error saving settings:', error);
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
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
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
                <Loader2 className="h-4 w-4 animate-spin" />
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
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
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
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab (trimmed) */}
        <TabsContent value="notifications" className="space-y-6">
          {/* My Room Section - at the top */}
          <MyRoomSection />
          
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
                    onValueChange={(value: unknown) => updateSetting('notification_frequency', value)}
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
                    onValueChange={(value: unknown) => updateSetting('theme', value)}
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
                    onValueChange={(value: unknown) => updateSetting('font_size', value)}
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
                    onValueChange={(value: unknown) => updateSetting('language', value)}
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
                    onValueChange={(value: unknown) => updateSetting('date_format', value)}
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
                    onValueChange={(value: unknown) => updateSetting('time_format', value)}
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
                          updateSetting('session_timeout', n as unknown);
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

        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-6">
          <AIApiKeyCard />
        </TabsContent>

      </Tabs>
    </div>
  );
}

type AIProvider = 'gemini' | 'openai' | 'anthropic';

const PROVIDER_STORAGE_KEYS: Record<AIProvider, string> = {
  gemini:    'gemini_api_key_override',
  openai:    'openai_api_key_override',
  anthropic: 'anthropic_api_key_override',
};
const PROVIDER_PREF_KEY = 'ai_provider_preference';

const PROVIDER_INFO: Record<AIProvider, { label: string; placeholder: string; model: string; link: string }> = {
  gemini:    { label: 'Google Gemini', placeholder: 'AIza...',    model: 'gemini-2.5-flash',       link: 'https://aistudio.google.com/app/apikey' },
  openai:    { label: 'OpenAI',        placeholder: 'sk-...',     model: 'gpt-4o-mini',            link: 'https://platform.openai.com/api-keys' },
  anthropic: { label: 'Anthropic',     placeholder: 'sk-ant-...', model: 'claude-3-5-haiku',       link: 'https://console.anthropic.com/settings/keys' },
};

const ALL_PROVIDERS: AIProvider[] = ['gemini', 'openai', 'anthropic'];

function AIApiKeyCard() {
  const { toast } = useToast();
  const [keys, setKeys]       = React.useState<Record<AIProvider, string>>({ gemini: '', openai: '', anthropic: '' });
  const [inputs, setInputs]   = React.useState<Record<AIProvider, string>>({ gemini: '', openai: '', anthropic: '' });
  const [visible, setVisible] = React.useState<Record<AIProvider, boolean>>({ gemini: false, openai: false, anthropic: false });
  const [pref, setPref]       = React.useState<AIProvider | 'auto'>('auto');

  React.useEffect(() => {
    const loaded = { gemini: '', openai: '', anthropic: '' } as Record<AIProvider, string>;
    for (const p of ALL_PROVIDERS) loaded[p] = localStorage.getItem(PROVIDER_STORAGE_KEYS[p]) ?? '';
    setKeys(loaded);
    setInputs(loaded);
    setPref((localStorage.getItem(PROVIDER_PREF_KEY) as AIProvider | 'auto') ?? 'auto');
  }, []);

  const handleSave = (p: AIProvider) => {
    const trimmed = inputs[p].trim();
    if (trimmed) {
      localStorage.setItem(PROVIDER_STORAGE_KEYS[p], trimmed);
    } else {
      localStorage.removeItem(PROVIDER_STORAGE_KEYS[p]);
    }
    setKeys(k => ({ ...k, [p]: trimmed }));
    toast({ title: trimmed ? `${PROVIDER_INFO[p].label} key saved` : `${PROVIDER_INFO[p].label} key cleared` });
  };

  const handleClear = (p: AIProvider) => {
    localStorage.removeItem(PROVIDER_STORAGE_KEYS[p]);
    setKeys(k => ({ ...k, [p]: '' }));
    setInputs(i => ({ ...i, [p]: '' }));
    toast({ title: `${PROVIDER_INFO[p].label} key cleared` });
  };

  const handlePrefChange = (value: string) => {
    const v = value as AIProvider | 'auto';
    setPref(v);
    v === 'auto' ? localStorage.removeItem(PROVIDER_PREF_KEY) : localStorage.setItem(PROVIDER_PREF_KEY, v);
  };

  const mask = (k: string) =>
    k.length > 10 ? k.slice(0, 6) + '•'.repeat(k.length - 10) + k.slice(-4) : '•'.repeat(k.length);

  const activeProvider: AIProvider | null =
    pref !== 'auto' && keys[pref]
      ? pref
      : ALL_PROVIDERS.find(p => keys[p]) ?? null;

  const anyKeySet = ALL_PROVIDERS.some(p => keys[p]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="space-y-2">
          <Label>Preferred Provider</Label>
          <Select value={pref} onValueChange={handlePrefChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto — use first available key</SelectItem>
              {ALL_PROVIDERS.map(p => (
                <SelectItem key={p} value={p}>{PROVIDER_INFO[p].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            When set to Auto the first key you've saved below is used. Set explicitly to always prefer one provider.
          </p>
        </div>

        <Separator />

        {ALL_PROVIDERS.map(p => {
          const info = PROVIDER_INFO[p];
          const saved = keys[p];
          const isActive = activeProvider === p;
          return (
            <div key={p} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium flex items-center gap-2">
                  {info.label}
                  {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                </Label>
                <span className="text-xs text-muted-foreground">{info.model}</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={visible[p] ? 'text' : 'password'}
                    placeholder={info.placeholder}
                    value={inputs[p]}
                    onChange={e => setInputs(i => ({ ...i, [p]: e.target.value }))}
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setVisible(v => ({ ...v, [p]: !v[p] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {visible[p] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={() => handleSave(p)} variant="default" size="sm">Save</Button>
                {saved && (
                  <Button onClick={() => handleClear(p)} variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {saved && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span className="font-mono">{mask(saved)}</span>
                </p>
              )}
            </div>
          );
        })}

        <Separator />

        {!anyKeySet && (
          <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-muted-foreground">
            <Bot className="h-4 w-4 shrink-0" />
            <p className="text-sm">No custom key set — using shared server key (gemini-2.5-flash)</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Get a free key:</p>
          <ul className="pl-2 space-y-0.5">
            {ALL_PROVIDERS.map(p => (
              <li key={p}>
                <a href={PROVIDER_INFO[p].link} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                  {PROVIDER_INFO[p].label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-1">Keys are stored only in your browser and are never sent to our servers.</p>
        </div>

      </CardContent>
    </Card>
  );
}
