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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  const loadSettings = async () => {
    if (!user?.id) return;

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
      const { error } = await supabase
        .from('profiles')
        .update({
          user_settings: settings,
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">You have unsaved changes</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Language</span>
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

        {/* Notifications Tab */}
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
                      <Smartphone className="h-4 w-4" />
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={settings.push_notifications}
                    onCheckedChange={(value) => updateSetting('push_notifications', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      SMS Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">Receive text messages for urgent updates</p>
                  </div>
                  <Switch
                    checked={settings.sms_notifications}
                    onCheckedChange={(value) => updateSetting('sms_notifications', value)}
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

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      {settings.notification_sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      Notification Sound
                    </Label>
                    <p className="text-sm text-muted-foreground">Play sound for notifications</p>
                  </div>
                  <Switch
                    checked={settings.notification_sound}
                    onCheckedChange={(value) => updateSetting('notification_sound', value)}
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
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Quiet Hours
                    </Label>
                    <p className="text-sm text-muted-foreground">Disable notifications during specified hours</p>
                  </div>
                  <Switch
                    checked={settings.quiet_hours_enabled}
                    onCheckedChange={(value) => updateSetting('quiet_hours_enabled', value)}
                  />
                </div>

                {settings.quiet_hours_enabled && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={settings.quiet_hours_start}
                        onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={settings.quiet_hours_end}
                        onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Profile Visibility</Label>
                  <Select
                    value={settings.profile_visibility}
                    onValueChange={(value: any) => updateSetting('profile_visibility', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="contacts_only">Contacts Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Show Online Status
                    </Label>
                    <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                  </div>
                  <Switch
                    checked={settings.show_online_status}
                    onCheckedChange={(value) => updateSetting('show_online_status', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Allow Contact Requests
                    </Label>
                    <p className="text-sm text-muted-foreground">Allow others to send you contact requests</p>
                  </div>
                  <Switch
                    checked={settings.allow_contact_requests}
                    onCheckedChange={(value) => updateSetting('allow_contact_requests', value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Data Sharing</h3>
                
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

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Communications</Label>
                    <p className="text-sm text-muted-foreground">Receive marketing emails and updates</p>
                  </div>
                  <Switch
                    checked={settings.data_sharing_marketing}
                    onCheckedChange={(value) => updateSetting('data_sharing_marketing', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would continue here but truncated for space */}
        
      </Tabs>
    </div>
  );
}
