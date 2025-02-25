
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SystemSettings {
  maintenance_mode: boolean;
  allow_user_registration: boolean;
  require_email_verification: boolean;
  session_timeout_minutes: number;
}

const defaultSettings: SystemSettings = {
  maintenance_mode: false,
  allow_user_registration: true,
  require_email_verification: true,
  session_timeout_minutes: 60
};

export function SystemSettingsSection() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const isValidSystemSettings = (value: unknown): value is SystemSettings => {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
      typeof v.maintenance_mode === 'boolean' &&
      typeof v.allow_user_registration === 'boolean' &&
      typeof v.require_email_verification === 'boolean' &&
      typeof v.session_timeout_minutes === 'number'
    );
  };

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'general_settings')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.value) {
        const valueAsUnknown = data.value as unknown;
        
        if (isValidSystemSettings(valueAsUnknown)) {
          setSettings({
            ...defaultSettings,
            ...valueAsUnknown
          });
        } else {
          console.error('Invalid settings data format');
          toast.error('Invalid settings format, using defaults');
          setSettings(defaultSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof SystemSettings, value: boolean) => {
    try {
      // If turning on maintenance mode, show confirmation dialog
      if (key === 'maintenance_mode' && value) {
        return; // The actual update will be handled by the AlertDialog
      }

      const newSettings = { ...settings, [key]: value };
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'general_settings',
          value: newSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setSettings(newSettings);
      toast.success('Setting updated successfully');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    }
  };

  const enableMaintenanceMode = async () => {
    try {
      const newSettings = { ...settings, maintenance_mode: true };
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'general_settings',
          value: newSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setSettings(newSettings);
      toast.success('Maintenance mode enabled');
    } catch (error) {
      console.error('Error enabling maintenance mode:', error);
      toast.error('Failed to enable maintenance mode');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">System Settings</h3>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">
              Enable maintenance mode to prevent user access
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    updateSetting('maintenance_mode', false);
                  }
                }}
              />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Enable Maintenance Mode?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will prevent all non-admin users from accessing the system. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={enableMaintenanceMode}>
                  Enable
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>User Registration</Label>
            <p className="text-sm text-muted-foreground">
              Allow new users to register
            </p>
          </div>
          <Switch
            checked={settings.allow_user_registration}
            onCheckedChange={(checked) => updateSetting('allow_user_registration', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Email Verification</Label>
            <p className="text-sm text-muted-foreground">
              Require email verification for new accounts
            </p>
          </div>
          <Switch
            checked={settings.require_email_verification}
            onCheckedChange={(checked) => updateSetting('require_email_verification', checked)}
          />
        </div>
      </div>
    </Card>
  );
}
