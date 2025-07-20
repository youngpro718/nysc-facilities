import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Layout, Bell, User } from "lucide-react";
import { AppearanceSettings } from "@/components/profile/AppearanceSettings";
import { AdminDashboardCustomization } from "@/components/profile/AdminDashboardCustomization";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function AdminProfileSettings() {
  const [personalSettings, setPersonalSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    systemAlerts: true,
    defaultView: "dashboard",
    timezone: "America/New_York",
    language: "en",
    dateFormat: "MM/dd/yyyy"
  });

  const updatePersonalSetting = (key: string, value: any) => {
    setPersonalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <Layout className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <User className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme & Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your admin interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppearanceSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Dashboard Layout
              </CardTitle>
              <CardDescription>
                Customize your dashboard layout and widget preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminDashboardCustomization />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive important updates via email
                    </p>
                  </div>
                  <Switch
                    checked={personalSettings.emailNotifications}
                    onCheckedChange={(checked) => updatePersonalSetting('emailNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive real-time browser notifications
                    </p>
                  </div>
                  <Switch
                    checked={personalSettings.pushNotifications}
                    onCheckedChange={(checked) => updatePersonalSetting('pushNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Weekly Reports</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive weekly summary reports
                    </p>
                  </div>
                  <Switch
                    checked={personalSettings.weeklyReports}
                    onCheckedChange={(checked) => updatePersonalSetting('weeklyReports', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">System Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive critical system alerts and warnings
                    </p>
                  </div>
                  <Switch
                    checked={personalSettings.systemAlerts}
                    onCheckedChange={(checked) => updatePersonalSetting('systemAlerts', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Preferences
              </CardTitle>
              <CardDescription>
                Configure your personal settings and defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultView">Default View</Label>
                  <Select
                    value={personalSettings.defaultView}
                    onValueChange={(value) => updatePersonalSetting('defaultView', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="spaces">Spaces</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="issues">Issues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={personalSettings.timezone}
                    onValueChange={(value) => updatePersonalSetting('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={personalSettings.language}
                    onValueChange={(value) => updatePersonalSetting('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={personalSettings.dateFormat}
                    onValueChange={(value) => updatePersonalSetting('dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
