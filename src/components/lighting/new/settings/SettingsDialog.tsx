import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bell, 
  Settings2, 
  Database, 
  Clock, 
  Mail,
  Shield
} from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    notifications: {
      emailAlerts: true,
      criticalIssues: true,
      overdueIssues: true,
      maintenanceReminders: false
    },
    maintenance: {
      defaultPriority: 'medium',
      autoAssignment: false,
      escalationDays: 7,
      reminderFrequency: 'daily'
    },
    reporting: {
      autoExport: false,
      exportFormat: 'pdf',
      reportFrequency: 'weekly',
      includePhotos: true
    },
    system: {
      darkMode: false,
      compactView: false,
      autoRefresh: true,
      refreshInterval: 30
    }
  });

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // Implementation would save settings to database/localStorage
    onOpenChange(false);
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Lighting Management Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="reporting">Reporting</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Alerts</Label>
                    <div className="text-sm text-muted-foreground">
                      Receive email notifications for lighting issues
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.emailAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'emailAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Critical Issue Alerts</Label>
                    <div className="text-sm text-muted-foreground">
                      Immediate notifications for critical issues
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.criticalIssues}
                    onCheckedChange={(checked) => updateSetting('notifications', 'criticalIssues', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Overdue Issue Alerts</Label>
                    <div className="text-sm text-muted-foreground">
                      Notifications for issues open longer than 7 days
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.overdueIssues}
                    onCheckedChange={(checked) => updateSetting('notifications', 'overdueIssues', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Reminders</Label>
                    <div className="text-sm text-muted-foreground">
                      Scheduled maintenance notifications
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.maintenanceReminders}
                    onCheckedChange={(checked) => updateSetting('notifications', 'maintenanceReminders', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Maintenance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Priority</Label>
                    <Select 
                      value={settings.maintenance.defaultPriority}
                      onValueChange={(value) => updateSetting('maintenance', 'defaultPriority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Escalation Threshold (days)</Label>
                    <Input
                      type="number"
                      value={settings.maintenance.escalationDays}
                      onChange={(e) => updateSetting('maintenance', 'escalationDays', parseInt(e.target.value))}
                      min="1"
                      max="30"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Assignment</Label>
                    <div className="text-sm text-muted-foreground">
                      Automatically assign issues to available technicians
                    </div>
                  </div>
                  <Switch
                    checked={settings.maintenance.autoAssignment}
                    onCheckedChange={(checked) => updateSetting('maintenance', 'autoAssignment', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reminder Frequency</Label>
                  <Select 
                    value={settings.maintenance.reminderFrequency}
                    onValueChange={(value) => updateSetting('maintenance', 'reminderFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reporting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Report Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Export</Label>
                    <div className="text-sm text-muted-foreground">
                      Automatically generate and export reports
                    </div>
                  </div>
                  <Switch
                    checked={settings.reporting.autoExport}
                    onCheckedChange={(checked) => updateSetting('reporting', 'autoExport', checked)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <Select 
                      value={settings.reporting.exportFormat}
                      onValueChange={(value) => updateSetting('reporting', 'exportFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Report Frequency</Label>
                    <Select 
                      value={settings.reporting.reportFrequency}
                      onValueChange={(value) => updateSetting('reporting', 'reportFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Photos</Label>
                    <div className="text-sm text-muted-foreground">
                      Include issue photos in reports
                    </div>
                  </div>
                  <Switch
                    checked={settings.reporting.includePhotos}
                    onCheckedChange={(checked) => updateSetting('reporting', 'includePhotos', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  System Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <div className="text-sm text-muted-foreground">
                      Enable dark theme for the interface
                    </div>
                  </div>
                  <Switch
                    checked={settings.system.darkMode}
                    onCheckedChange={(checked) => updateSetting('system', 'darkMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact View</Label>
                    <div className="text-sm text-muted-foreground">
                      Show more information in less space
                    </div>
                  </div>
                  <Switch
                    checked={settings.system.compactView}
                    onCheckedChange={(checked) => updateSetting('system', 'compactView', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Refresh</Label>
                    <div className="text-sm text-muted-foreground">
                      Automatically refresh data
                    </div>
                  </div>
                  <Switch
                    checked={settings.system.autoRefresh}
                    onCheckedChange={(checked) => updateSetting('system', 'autoRefresh', checked)}
                  />
                </div>

                {settings.system.autoRefresh && (
                  <div className="space-y-2">
                    <Label>Refresh Interval (seconds)</Label>
                    <Input
                      type="number"
                      value={settings.system.refreshInterval}
                      onChange={(e) => updateSetting('system', 'refreshInterval', parseInt(e.target.value))}
                      min="10"
                      max="300"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}