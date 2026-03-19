import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Bell, Mail, Monitor, Palette, Sun, Moon,
  Lock, Shield, Accessibility, Bot,
  AlertTriangle, CheckCircle, Download, RefreshCw,
  Eye, EyeOff, Trash2,
} from 'lucide-react';
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
import { useToast } from '@shared/hooks/use-toast';
import { useAuth } from '@features/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useTheme, useEnhancedTheme } from '@/providers/EnhancedThemeProvider';
import { MyRoomSection } from './MyRoomSection';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserSettings {
  // Notifications
  email_notifications: boolean;
  desktop_notifications: boolean;
  notification_frequency: 'immediate' | 'daily';
  data_sharing_analytics: boolean;
  // Display
  theme: 'light' | 'dark' | 'system';
  font_size: 'small' | 'medium' | 'large';
  language: 'en' | 'es' | 'fr';
  timezone: string;
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  time_format: '12h' | '24h';
  // Security
  two_factor_enabled: boolean;
  session_timeout: number;
  login_notifications: boolean;
  // Accessibility
  high_contrast: boolean;
  screen_reader_support: boolean;
  keyboard_navigation: boolean;
  motion_reduced: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  email_notifications: true,
  desktop_notifications: true,
  notification_frequency: 'immediate',
  data_sharing_analytics: false,
  theme: 'system',
  font_size: 'medium',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  date_format: 'MM/DD/YYYY',
  time_format: '12h',
  two_factor_enabled: false,
  session_timeout: 30,
  login_notifications: true,
  high_contrast: false,
  screen_reader_support: false,
  keyboard_navigation: false,
  motion_reduced: false,
};

// ─── Tab routing ──────────────────────────────────────────────────────────────

const VALID_TABS = ['notifications', 'display', 'security', 'accessibility', 'ai'] as const;
type SettingsTab = (typeof VALID_TABS)[number];

function toCanonicalTab(raw: string): SettingsTab {
  if (raw === 'appearance' || raw === 'language') return 'display';
  if (raw === 'privacy') return 'security';
  return (VALID_TABS as readonly string[]).includes(raw)
    ? (raw as SettingsTab)
    : 'notifications';
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useUserSettings(userId: string | undefined) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    supabase
      .from('profiles')
      .select('user_settings')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') {
          logger.error('Failed to load user settings:', error);
          toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
        } else if (data?.user_settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...(data.user_settings as Partial<UserSettings>) });
        }
        setIsLoading(false);
      });
  }, [userId]); // toast is stable

  const updateSetting = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const saveSettings = useCallback(async (current: UserSettings) => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_settings: current, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      setHasChanges(false);
      toast({ title: 'Success', description: 'Settings saved successfully' });
    } catch (error) {
      logger.error('Failed to save user settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [userId]); // toast is stable

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
    toast({ title: 'Settings Reset', description: 'All settings have been reset to defaults' });
  }, []);

  return { settings, isLoading, isSaving, hasChanges, updateSetting, saveSettings, resetSettings };
}

// ─── Shared UI primitive ──────────────────────────────────────────────────────

interface SettingsRowProps {
  label: React.ReactNode;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}

function SettingsRow({ label, description, checked, onCheckedChange }: SettingsRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

interface TabProps {
  settings: UserSettings;
  onChange: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  isAdmin?: boolean;
}

function NotificationsTab({ settings, onChange, isAdmin }: TabProps) {
  return (
    <div className="space-y-6">
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
            <SettingsRow
              label={<span className="flex items-center gap-2"><Mail className="h-4 w-4" />Email Notifications</span>}
              description="Receive updates via email"
              checked={settings.email_notifications}
              onCheckedChange={v => onChange('email_notifications', v)}
            />
            <SettingsRow
              label={<span className="flex items-center gap-2"><Monitor className="h-4 w-4" />Desktop Notifications</span>}
              description="Show browser notifications"
              checked={settings.desktop_notifications}
              onCheckedChange={v => onChange('desktop_notifications', v)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Notification Frequency</Label>
            <Select
              value={settings.notification_frequency}
              onValueChange={v => onChange('notification_frequency', v as UserSettings['notification_frequency'])}
            >
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Data</h3>
                <SettingsRow
                  label="Analytics Data"
                  description="Help improve the app with usage analytics"
                  checked={settings.data_sharing_analytics}
                  onCheckedChange={v => onChange('data_sharing_analytics', v)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DisplayTab({ settings, onChange }: TabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Display Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={v => onChange('theme', v as UserSettings['theme'])}
            >
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light"><span className="flex items-center gap-2"><Sun className="h-4 w-4" />Light</span></SelectItem>
                <SelectItem value="dark"><span className="flex items-center gap-2"><Moon className="h-4 w-4" />Dark</span></SelectItem>
                <SelectItem value="system"><span className="flex items-center gap-2"><Monitor className="h-4 w-4" />System</span></SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Font Size</Label>
            <Select
              value={settings.font_size}
              onValueChange={v => onChange('font_size', v as UserSettings['font_size'])}
            >
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
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
          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={settings.language}
              onValueChange={v => onChange('language', v as UserSettings['language'])}
            >
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select
              value={settings.date_format}
              onValueChange={v => onChange('date_format', v as UserSettings['date_format'])}
            >
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Time Format</Label>
            <Select
              value={settings.time_format}
              onValueChange={v => onChange('time_format', v as UserSettings['time_format'])}
            >
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityTab({ settings, onChange, isAdmin }: TabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Security Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <SettingsRow
            label={<span className="flex items-center gap-2"><Shield className="h-4 w-4" />Two-Factor Authentication</span>}
            description="Add an extra layer of security to your account"
            checked={settings.two_factor_enabled}
            onCheckedChange={v => onChange('two_factor_enabled', v)}
          />

          {isAdmin && (
            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <Select
                value={settings.session_timeout.toString()}
                onValueChange={v => onChange('session_timeout', Number(v))}
              >
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[15, 30, 60, 120].map(m => (
                    <SelectItem key={m} value={m.toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <SettingsRow
            label="Login Notifications"
            description="Get notified about new logins"
            checked={settings.login_notifications}
            onCheckedChange={v => onChange('login_notifications', v)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function AccessibilityTab({ settings, onChange }: TabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="h-5 w-5" />
          Accessibility Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingsRow
          label={<span className="flex items-center gap-2"><Accessibility className="h-4 w-4" />Screen Reader Support</span>}
          description="Optimize interface for screen readers"
          checked={settings.screen_reader_support}
          onCheckedChange={v => onChange('screen_reader_support', v)}
        />
        <SettingsRow
          label="Keyboard Navigation"
          description="Enhanced keyboard navigation support"
          checked={settings.keyboard_navigation}
          onCheckedChange={v => onChange('keyboard_navigation', v)}
        />
        <SettingsRow
          label="Reduce Motion"
          description="Minimize animations and transitions"
          checked={settings.motion_reduced}
          onCheckedChange={v => onChange('motion_reduced', v)}
        />
        <SettingsRow
          label="High Contrast"
          description="Increase contrast for better readability"
          checked={settings.high_contrast}
          onCheckedChange={v => onChange('high_contrast', v)}
        />
      </CardContent>
    </Card>
  );
}

// ─── AI API key card ──────────────────────────────────────────────────────────

type AIProvider = 'gemini' | 'openai' | 'anthropic';

const PROVIDER_STORAGE_KEYS: Record<AIProvider, string> = {
  gemini:    'gemini_api_key_override',
  openai:    'openai_api_key_override',
  anthropic: 'anthropic_api_key_override',
};
const PROVIDER_PREF_KEY = 'ai_provider_preference';

const PROVIDER_INFO: Record<AIProvider, { label: string; placeholder: string; model: string; link: string }> = {
  gemini:    { label: 'Google Gemini', placeholder: 'AIza...',    model: 'gemini-2.5-flash',  link: 'https://aistudio.google.com/app/apikey' },
  openai:    { label: 'OpenAI',        placeholder: 'sk-...',     model: 'gpt-4o-mini',       link: 'https://platform.openai.com/api-keys' },
  anthropic: { label: 'Anthropic',     placeholder: 'sk-ant-...', model: 'claude-3-5-haiku',  link: 'https://console.anthropic.com/settings/keys' },
};

const ALL_PROVIDERS: AIProvider[] = ['gemini', 'openai', 'anthropic'];

function AIApiKeyCard() {
  const { toast } = useToast();
  const [keys,    setKeys]    = useState<Record<AIProvider, string>>({ gemini: '', openai: '', anthropic: '' });
  const [inputs,  setInputs]  = useState<Record<AIProvider, string>>({ gemini: '', openai: '', anthropic: '' });
  const [visible, setVisible] = useState<Record<AIProvider, boolean>>({ gemini: false, openai: false, anthropic: false });
  const [pref,    setPref]    = useState<AIProvider | 'auto'>('auto');

  useEffect(() => {
    const loaded = {} as Record<AIProvider, string>;
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

  const maskKey = (k: string) =>
    k.length > 10 ? k.slice(0, 6) + '•'.repeat(k.length - 10) + k.slice(-4) : '•'.repeat(k.length);

  const activeProvider: AIProvider | null =
    pref !== 'auto' && keys[pref] ? pref : ALL_PROVIDERS.find(p => keys[p]) ?? null;

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
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto — use first available key</SelectItem>
              {ALL_PROVIDERS.map(p => (
                <SelectItem key={p} value={p}>{PROVIDER_INFO[p].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            When set to Auto the first key you've saved below is used.
          </p>
        </div>

        <Separator />

        {ALL_PROVIDERS.map(p => {
          const info = PROVIDER_INFO[p];
          const saved = keys[p];
          return (
            <div key={p} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium flex items-center gap-2">
                  {info.label}
                  {activeProvider === p && <Badge variant="secondary" className="text-xs">Active</Badge>}
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
                <Button onClick={() => handleSave(p)} size="sm">Save</Button>
                {saved && (
                  <Button onClick={() => handleClear(p)} variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {saved && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span className="font-mono">{maskKey(saved)}</span>
                </p>
              )}
            </div>
          );
        })}

        <Separator />

        {!ALL_PROVIDERS.some(p => keys[p]) && (
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

// ─── Main component ───────────────────────────────────────────────────────────

export function EnhancedUserSettings() {
  const { user, isAdmin } = useAuth();
  const { setTheme } = useTheme();
  const { updateSettings: updateEnhancedTheme } = useEnhancedTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const { settings, isLoading, isSaving, hasChanges, updateSetting, saveSettings, resetSettings } =
    useUserSettings(user?.id);

  const activeTab = toCanonicalTab(searchParams.get('settingsTab') ?? 'notifications');

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('settingsTab', value);
    setSearchParams(next, { replace: true });
  };

  // Apply theme/display settings immediately when they change.
  useEffect(() => {
    if (isLoading) return;
    updateEnhancedTheme({
      variant: settings.theme,
      fontSize: settings.font_size,
      layoutDensity: 'comfortable',
      reducedMotion: settings.motion_reduced,
      highContrast: settings.high_contrast,
    });
    const resolvedTheme = settings.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme;
    setTheme(resolvedTheme);
  }, [isLoading, settings.theme, settings.font_size, settings.motion_reduced, settings.high_contrast, updateEnhancedTheme, setTheme]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-settings.json';
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Settings</h1>
          <p className="text-muted-foreground">Customize your experience and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={resetSettings}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </>
          )}
          <Button
            onClick={() => saveSettings(settings)}
            disabled={!hasChanges || isSaving}
            className="min-w-[100px]"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Save Changes
              </span>
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3 lg:grid-cols-5' : 'grid-cols-3'}`}>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /><span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Palette className="h-4 w-4" /><span className="hidden sm:inline">Display</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" /><span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="accessibility" className="flex items-center gap-2">
                <Accessibility className="h-4 w-4" /><span className="hidden sm:inline">Accessibility</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="h-4 w-4" /><span className="hidden sm:inline">AI</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="notifications">
          <NotificationsTab settings={settings} onChange={updateSetting} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="display">
          <DisplayTab settings={settings} onChange={updateSetting} />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab settings={settings} onChange={updateSetting} isAdmin={isAdmin} />
        </TabsContent>
        {isAdmin && (
          <>
            <TabsContent value="accessibility">
              <AccessibilityTab settings={settings} onChange={updateSetting} />
            </TabsContent>
            <TabsContent value="ai">
              <AIApiKeyCard />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
