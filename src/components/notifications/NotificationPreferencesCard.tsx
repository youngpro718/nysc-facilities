import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, Smartphone, Volume2, VolumeX, Clock, Monitor, Phone } from "lucide-react";
import { toast } from "sonner";

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  desktop_notifications: boolean;
  notification_sound: boolean;
  key_request_updates: boolean;
  order_status_updates: boolean;
  maintenance_alerts: boolean;
  system_announcements: boolean;
  security_alerts: boolean;
  urgency_threshold: 'low' | 'medium' | 'high';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  notification_frequency: 'immediate' | 'hourly' | 'daily';
}

const defaultPreferences: NotificationPreferences = {
  email_notifications: true,
  push_notifications: true,
  sms_notifications: false,
  desktop_notifications: true,
  notification_sound: true,
  key_request_updates: true,
  order_status_updates: true,
  maintenance_alerts: true,
  system_announcements: false,
  security_alerts: true,
  urgency_threshold: 'medium',
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  notification_frequency: 'immediate'
};

export function NotificationPreferencesCard() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        setPreferences({ ...defaultPreferences, ...(data.notification_preferences as Record<string, any>) });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          notification_preferences: preferences as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const testNotification = () => {
    toast.info("This is a test notification", {
      description: "You will receive notifications like this based on your preferences.",
      duration: 5000
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Methods */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Delivery Methods
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">Email Notifications</span>
                  <p className="text-xs text-muted-foreground">Receive updates via email</p>
                </div>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">Push Notifications</span>
                  <p className="text-xs text-muted-foreground">Mobile and browser alerts</p>
                </div>
              </div>
              <Switch
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">SMS Notifications</span>
                  <p className="text-xs text-muted-foreground">Text messages for urgent alerts</p>
                </div>
              </div>
              <Switch
                checked={preferences.sms_notifications}
                onCheckedChange={(checked) => updatePreference('sms_notifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">Desktop Notifications</span>
                  <p className="text-xs text-muted-foreground">Browser notifications</p>
                </div>
              </div>
              <Switch
                checked={preferences.desktop_notifications}
                onCheckedChange={(checked) => updatePreference('desktop_notifications', checked)}
              />
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="font-medium">Notification Types</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Key Request Updates</span>
                <p className="text-xs text-muted-foreground">Status changes for your key requests</p>
              </div>
              <Switch
                checked={preferences.key_request_updates}
                onCheckedChange={(checked) => updatePreference('key_request_updates', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Order Status Updates</span>
                <p className="text-xs text-muted-foreground">When your keys are ready for pickup</p>
              </div>
              <Switch
                checked={preferences.order_status_updates}
                onCheckedChange={(checked) => updatePreference('order_status_updates', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Maintenance Alerts</span>
                <p className="text-xs text-muted-foreground">Scheduled maintenance affecting your areas</p>
              </div>
              <Switch
                checked={preferences.maintenance_alerts}
                onCheckedChange={(checked) => updatePreference('maintenance_alerts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">System Announcements</span>
                <p className="text-xs text-muted-foreground">General system updates and news</p>
              </div>
              <Switch
                checked={preferences.system_announcements}
                onCheckedChange={(checked) => updatePreference('system_announcements', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Security Alerts</span>
                <p className="text-xs text-muted-foreground">Important security notifications and login alerts</p>
              </div>
              <Switch
                checked={preferences.security_alerts}
                onCheckedChange={(checked) => updatePreference('security_alerts', checked)}
              />
            </div>
          </div>
        </div>

        {/* Urgency Threshold */}
        <div className="space-y-4">
          <h4 className="font-medium">Urgency Threshold</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Only notify me for:</span>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <Badge
                  key={level}
                  variant={preferences.urgency_threshold === level ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => updatePreference('urgency_threshold', level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)} priority
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Sound and Timing Settings */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Sound & Timing
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {preferences.notification_sound ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
                <div>
                  <span className="text-sm font-medium">Notification Sound</span>
                  <p className="text-xs text-muted-foreground">Play sound for notifications</p>
                </div>
              </div>
              <Switch
                checked={preferences.notification_sound}
                onCheckedChange={(checked) => updatePreference('notification_sound', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Frequency</label>
              <div className="flex gap-2">
                {(['immediate', 'hourly', 'daily'] as const).map((freq) => (
                  <Badge
                    key={freq}
                    variant={preferences.notification_frequency === freq ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => updatePreference('notification_frequency', freq)}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Quiet Hours</span>
                <p className="text-xs text-muted-foreground">Disable notifications during specified hours</p>
              </div>
              <Switch
                checked={preferences.quiet_hours_enabled}
                onCheckedChange={(checked) => updatePreference('quiet_hours_enabled', checked)}
              />
            </div>
            
            {preferences.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="text-xs text-muted-foreground">Start Time</label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_start}
                    onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                    className="w-full mt-1 px-3 py-1 text-sm border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">End Time</label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_end}
                    onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                    className="w-full mt-1 px-3 py-1 text-sm border rounded-md"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={testNotification}
            className="flex items-center gap-2"
          >
            {preferences.push_notifications ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Test Notification
          </Button>
          <Button 
            onClick={savePreferences}
            disabled={isSaving}
            size="sm"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}