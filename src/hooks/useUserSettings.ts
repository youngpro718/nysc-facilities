import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';

export interface UserSettings {
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
  
  // Notification Categories
  notify_key_requests: boolean;
  notify_supply_requests: boolean;
  notify_maintenance_alerts: boolean;
  notify_system_updates: boolean;
  notify_security_alerts: boolean;
  
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
  font_size: number;
  animations_enabled: boolean;
  
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
  
  // Workflow Settings
  default_dashboard: 'overview' | 'requests' | 'issues' | 'calendar';
  items_per_page: number;
  auto_refresh: boolean;
  refresh_interval: number;
  keyboard_shortcuts: boolean;
  sidebar_collapsed: boolean;
}

const defaultSettings: UserSettings = {
  // Notification Settings
  email_notifications: true,
  push_notifications: true,
  sms_notifications: false,
  desktop_notifications: true,
  notification_sound: true,
  notification_frequency: 'immediate',
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  
  // Notification Categories
  notify_key_requests: true,
  notify_supply_requests: true,
  notify_maintenance_alerts: true,
  notify_system_updates: false,
  notify_security_alerts: true,
  
  // Privacy Settings
  profile_visibility: 'contacts_only',
  show_online_status: true,
  allow_contact_requests: true,
  data_sharing_analytics: false,
  data_sharing_marketing: false,
  
  // Appearance Settings
  theme: 'system',
  color_scheme: 'blue',
  compact_mode: false,
  high_contrast: false,
  font_size: 14,
  animations_enabled: true,
  
  // Language & Region
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  date_format: 'MM/DD/YYYY',
  time_format: '12h',
  
  // Security Settings
  two_factor_enabled: false,
  session_timeout: 30,
  login_notifications: true,
  device_tracking: true,
  
  // Accessibility Settings
  screen_reader_support: false,
  keyboard_navigation: false,
  motion_reduced: false,
  text_to_speech: false,
  
  // Workflow Settings
  default_dashboard: 'overview',
  items_per_page: 25,
  auto_refresh: true,
  refresh_interval: 30,
  keyboard_shortcuts: true,
  sidebar_collapsed: false,
};

export function useUserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from database
  const loadSettings = useCallback(async () => {
    if (!user?.id) {
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
        // Merge database settings with defaults
        const userSettings = (data as any).user_settings || {};
        const mergedSettings = { ...defaultSettings };
        Object.keys(defaultSettings).forEach(key => {
          if (userSettings[key] !== null && userSettings[key] !== undefined) {
            (mergedSettings as any)[key] = userSettings[key];
          }
        });
        setSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      toast({
        title: "Error",
        description: "Failed to load user settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  // Save settings to database
  const saveSettings = useCallback(async (newSettings?: Partial<UserSettings>) => {
    if (!user?.id) return;

    const settingsToSave = newSettings ? { ...settings, ...newSettings } : settings;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          user_settings: settingsToSave as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      if (newSettings) {
        setSettings(settingsToSave);
      }
      setHasChanges(false);
      
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving user settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, settings, toast]);

  // Update a single setting
  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K, 
    value: UserSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  // Update multiple settings
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults",
    });
  }, [toast]);

  // Apply theme settings to document
  const applyThemeSettings = useCallback(() => {
    const root = document.documentElement;
    
    // Apply theme
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    
    // Apply font size
    root.style.fontSize = `${settings.font_size}px`;
    
    // Apply compact mode
    if (settings.compact_mode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
    
    // Apply high contrast
    if (settings.high_contrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply reduced motion
    if (settings.motion_reduced) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [settings]);

  // Get setting value with fallback
  const getSetting = useCallback(<K extends keyof UserSettings>(
    key: K, 
    fallback?: UserSettings[K]
  ): UserSettings[K] => {
    return settings[key] ?? fallback ?? defaultSettings[key];
  }, [settings]);

  // Check if notifications are enabled for a category
  const isNotificationEnabled = useCallback((category: string): boolean => {
    const categoryKey = `notify_${category}` as keyof UserSettings;
    return getSetting(categoryKey, true) as boolean;
  }, [getSetting]);

  // Export settings as JSON
  const exportSettings = useCallback(() => {
    const data = {
      ...settings,
      exported_at: new Date().toISOString(),
      version: '1.0',
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `user-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Settings Exported",
      description: "Your settings have been exported successfully",
    });
  }, [settings, toast]);

  // Import settings from JSON
  const importSettings = useCallback((jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      const importedSettings = { ...defaultSettings };
      
      // Validate and merge imported settings
      Object.keys(defaultSettings).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          (importedSettings as any)[key] = data[key];
        }
      });
      
      setSettings(importedSettings);
      setHasChanges(true);
      
      toast({
        title: "Settings Imported",
        description: "Your settings have been imported successfully",
      });
    } catch (error) {
      console.error('Error importing settings:', error);
      toast({
        title: "Import Error",
        description: "Failed to import settings. Please check the file format.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Load settings on mount and user change
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Apply theme settings when they change
  useEffect(() => {
    if (!isLoading) {
      applyThemeSettings();
    }
  }, [settings.theme, settings.font_size, settings.compact_mode, settings.high_contrast, settings.motion_reduced, applyThemeSettings, isLoading]);

  return {
    settings,
    isLoading,
    isSaving,
    hasChanges,
    updateSetting,
    updateSettings,
    saveSettings,
    resetSettings,
    loadSettings,
    getSetting,
    isNotificationEnabled,
    exportSettings,
    importSettings,
    applyThemeSettings,
  };
}
