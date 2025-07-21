import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  User,
  Calendar,
  MapPin,
  Phone,
  Save,
  RotateCcw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Globe,
  Palette
} from 'lucide-react';

interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  desktop_enabled: boolean;
  sound_enabled: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  categories: {
    key_requests: boolean;
    supply_requests: boolean;
    maintenance_alerts: boolean;
    system_updates: boolean;
    security_alerts: boolean;
  };
}

interface DisplayPreferences {
  theme: 'light' | 'dark' | 'system';
  color_scheme: string;
  font_size: number;
  compact_mode: boolean;
  high_contrast: boolean;
  animations_enabled: boolean;
  sidebar_collapsed: boolean;
}

interface PrivacyPreferences {
  profile_visibility: 'public' | 'private' | 'contacts_only';
  show_online_status: boolean;
  allow_contact_requests: boolean;
  data_collection: boolean;
  marketing_emails: boolean;
  analytics_tracking: boolean;
}

interface WorkflowPreferences {
  default_dashboard: 'overview' | 'requests' | 'issues' | 'calendar';
  items_per_page: number;
  auto_refresh: boolean;
  refresh_interval: number;
  keyboard_shortcuts: boolean;
  quick_actions: string[];
}

const defaultNotificationPrefs: NotificationPreferences = {
  email_enabled: true,
  push_enabled: true,
  sms_enabled: false,
  desktop_enabled: true,
  sound_enabled: true,
  frequency: 'immediate',
  quiet_hours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  categories: {
    key_requests: true,
    supply_requests: true,
    maintenance_alerts: true,
    system_updates: false,
    security_alerts: true,
  },
};

const defaultDisplayPrefs: DisplayPreferences = {
  theme: 'system',
  color_scheme: 'blue',
  font_size: 14,
  compact_mode: false,
  high_contrast: false,
  animations_enabled: true,
  sidebar_collapsed: false,
};

const defaultPrivacyPrefs: PrivacyPreferences = {
  profile_visibility: 'contacts_only',
  show_online_status: true,
  allow_contact_requests: true,
  data_collection: false,
  marketing_emails: false,
  analytics_tracking: false,
};

const defaultWorkflowPrefs: WorkflowPreferences = {
  default_dashboard: 'overview',
  items_per_page: 25,
  auto_refresh: true,
  refresh_interval: 30,
  keyboard_shortcuts: true,
  quick_actions: ['create_request', 'report_issue', 'view_profile'],
};

export function UserPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<NotificationPreferences>(defaultNotificationPrefs);
  const [display, setDisplay] = useState<DisplayPreferences>(defaultDisplayPrefs);
  const [privacy, setPrivacy] = useState<PrivacyPreferences>(defaultPrivacyPrefs);
  const [workflow, setWorkflow] = useState<WorkflowPreferences>(defaultWorkflowPrefs);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = async () => {
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
        setNotifications({ ...defaultNotificationPrefs, ...(data as any).user_preferences?.notifications });
        setDisplay({ ...defaultDisplayPrefs, ...(data as any).user_preferences?.display });
        setPrivacy({ ...defaultPrivacyPrefs, ...(data as any).user_preferences?.privacy });
        setWorkflow({ ...defaultWorkflowPrefs, ...(data as any).user_preferences?.workflow });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          user_preferences: {
            notifications,
            display,
            privacy,
            workflow
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setHasChanges(false);
      toast({
        title: "Success",
        description: "Preferences saved successfully",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetPreferences = () => {
    setNotifications(defaultNotificationPrefs);
    setDisplay(defaultDisplayPrefs);
    setPrivacy(defaultPrivacyPrefs);
    setWorkflow(defaultWorkflowPrefs);
    setHasChanges(true);
    toast({
      title: "Preferences Reset",
      description: "All preferences have been reset to defaults",
    });
  };

  const exportPreferences = () => {
    const data = {
      notifications,
      display,
      privacy,
      workflow,
      exported_at: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'user-preferences.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Preferences Exported",
      description: "Your preferences have been exported successfully",
    });
  };

  const updateNotifications = (updates: Partial<NotificationPreferences>) => {
    setNotifications(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateDisplay = (updates: Partial<DisplayPreferences>) => {
    setDisplay(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updatePrivacy = (updates: Partial<PrivacyPreferences>) => {
    setPrivacy(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateWorkflow = (updates: Partial<WorkflowPreferences>) => {
    setWorkflow(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Preferences</h1>
          <p className="text-muted-foreground">Customize your experience and workflow</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportPreferences}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={resetPreferences}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={savePreferences} 
            disabled={!hasChanges || isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={notifications.email_enabled}
                  onCheckedChange={(value) => updateNotifications({ email_enabled: value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Mobile and browser notifications</p>
                </div>
                <Switch
                  checked={notifications.push_enabled}
                  onCheckedChange={(value) => updateNotifications({ push_enabled: value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    SMS Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Text messages for urgent updates</p>
                </div>
                <Switch
                  checked={notifications.sms_enabled}
                  onCheckedChange={(value) => updateNotifications({ sms_enabled: value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    {notifications.sound_enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    Notification Sound
                  </Label>
                  <p className="text-sm text-muted-foreground">Play sound for notifications</p>
                </div>
                <Switch
                  checked={notifications.sound_enabled}
                  onCheckedChange={(value) => updateNotifications({ sound_enabled: value })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label>Notification Frequency</Label>
                <Select
                  value={notifications.frequency}
                  onValueChange={(value: any) => updateNotifications({ frequency: value })}
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
                  checked={notifications.quiet_hours.enabled}
                  onCheckedChange={(value) => 
                    updateNotifications({ 
                      quiet_hours: { ...notifications.quiet_hours, enabled: value }
                    })
                  }
                />
              </div>

              {notifications.quiet_hours.enabled && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={notifications.quiet_hours.start}
                      onChange={(e) => 
                        updateNotifications({ 
                          quiet_hours: { ...notifications.quiet_hours, start: e.target.value }
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={notifications.quiet_hours.end}
                      onChange={(e) => 
                        updateNotifications({ 
                          quiet_hours: { ...notifications.quiet_hours, end: e.target.value }
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Display Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Display & Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Theme</Label>
                <Select
                  value={display.theme}
                  onValueChange={(value: any) => updateDisplay({ theme: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Font Size</Label>
                <div className="mt-2">
                  <Slider
                    value={[display.font_size]}
                    onValueChange={([value]) => updateDisplay({ font_size: value })}
                    min={12}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>Small</span>
                    <span>{display.font_size}px</span>
                    <span>Large</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Use smaller spacing and elements</p>
                </div>
                <Switch
                  checked={display.compact_mode}
                  onCheckedChange={(value) => updateDisplay({ compact_mode: value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>High Contrast</Label>
                  <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                </div>
                <Switch
                  checked={display.high_contrast}
                  onCheckedChange={(value) => updateDisplay({ high_contrast: value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Animations
                  </Label>
                  <p className="text-sm text-muted-foreground">Enable smooth transitions and animations</p>
                </div>
                <Switch
                  checked={display.animations_enabled}
                  onCheckedChange={(value) => updateDisplay({ animations_enabled: value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Profile Visibility</Label>
                <Select
                  value={privacy.profile_visibility}
                  onValueChange={(value: any) => updatePrivacy({ profile_visibility: value })}
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
                    {privacy.show_online_status ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    Show Online Status
                  </Label>
                  <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                </div>
                <Switch
                  checked={privacy.show_online_status}
                  onCheckedChange={(value) => updatePrivacy({ show_online_status: value })}
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
                  checked={privacy.allow_contact_requests}
                  onCheckedChange={(value) => updatePrivacy({ allow_contact_requests: value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data Collection</Label>
                  <p className="text-sm text-muted-foreground">Allow usage data collection for improvements</p>
                </div>
                <Switch
                  checked={privacy.data_collection}
                  onCheckedChange={(value) => updatePrivacy({ data_collection: value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Receive marketing communications</p>
                </div>
                <Switch
                  checked={privacy.marketing_emails}
                  onCheckedChange={(value) => updatePrivacy({ marketing_emails: value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Workflow & Interface
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Default Dashboard</Label>
                <Select
                  value={workflow.default_dashboard}
                  onValueChange={(value: any) => updateWorkflow({ default_dashboard: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="requests">My Requests</SelectItem>
                    <SelectItem value="issues">My Issues</SelectItem>
                    <SelectItem value="calendar">Calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Items Per Page</Label>
                <Select
                  value={workflow.items_per_page.toString()}
                  onValueChange={(value) => updateWorkflow({ items_per_page: parseInt(value) })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 items</SelectItem>
                    <SelectItem value="25">25 items</SelectItem>
                    <SelectItem value="50">50 items</SelectItem>
                    <SelectItem value="100">100 items</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Refresh</Label>
                  <p className="text-sm text-muted-foreground">Automatically refresh data</p>
                </div>
                <Switch
                  checked={workflow.auto_refresh}
                  onCheckedChange={(value) => updateWorkflow({ auto_refresh: value })}
                />
              </div>

              {workflow.auto_refresh && (
                <div className="ml-6">
                  <Label>Refresh Interval (seconds)</Label>
                  <div className="mt-2">
                    <Slider
                      value={[workflow.refresh_interval]}
                      onValueChange={([value]) => updateWorkflow({ refresh_interval: value })}
                      min={10}
                      max={300}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>10s</span>
                      <span>{workflow.refresh_interval}s</span>
                      <span>5m</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Keyboard Shortcuts</Label>
                  <p className="text-sm text-muted-foreground">Enable keyboard shortcuts</p>
                </div>
                <Switch
                  checked={workflow.keyboard_shortcuts}
                  onCheckedChange={(value) => updateWorkflow({ keyboard_shortcuts: value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
