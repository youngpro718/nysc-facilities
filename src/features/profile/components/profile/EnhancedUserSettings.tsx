import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Bell, Mail, Monitor,
  AlertTriangle, CheckCircle,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@shared/hooks/use-toast';
import { useAuth } from '@features/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { MyRoomSection } from './MyRoomSection';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserSettings {
  email_notifications: boolean;
  desktop_notifications: boolean;
  notification_frequency: 'immediate' | 'daily';
  data_sharing_analytics: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  email_notifications: true,
  desktop_notifications: true,
  notification_frequency: 'immediate',
  data_sharing_analytics: false,
};

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

  return { settings, isLoading, isSaving, hasChanges, updateSetting, saveSettings };
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

// ─── Legacy localStorage purge (kept for safety) ──────────────────────────────

const LEGACY_AI_KEY_NAMES = [
  'gemini_api_key_override',
  'openai_api_key_override',
  'anthropic_api_key_override',
  'ai_provider_preference',
];

function purgeLegacyAiKeysFromLocalStorage() {
  if (typeof window === 'undefined') return;
  for (const k of LEGACY_AI_KEY_NAMES) {
    try { window.localStorage.removeItem(k); } catch { /* noop */ }
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EnhancedUserSettings() {
  const { user, isAdmin } = useAuth();

  const { settings, isLoading, isSaving, hasChanges, updateSetting, saveSettings } =
    useUserSettings(user?.id);

  useEffect(() => { purgeLegacyAiKeysFromLocalStorage(); }, []);

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
          <p className="text-muted-foreground">Manage your notification preferences</p>
        </div>
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
              onCheckedChange={v => updateSetting('email_notifications', v)}
            />
            <SettingsRow
              label={<span className="flex items-center gap-2"><Monitor className="h-4 w-4" />Desktop Notifications</span>}
              description="Show browser notifications"
              checked={settings.desktop_notifications}
              onCheckedChange={v => updateSetting('desktop_notifications', v)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Notification Frequency</Label>
            <Select
              value={settings.notification_frequency}
              onValueChange={v => updateSetting('notification_frequency', v as UserSettings['notification_frequency'])}
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
                  onCheckedChange={v => updateSetting('data_sharing_analytics', v)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
