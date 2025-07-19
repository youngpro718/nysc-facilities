import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Server, 
  Shield, 
  Bell, 
  Database, 
  Users, 
  Settings, 
  AlertTriangle, 
  Clock, 
  Mail,
  FileText,
  Trash2,
  Download
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { ModuleManagement } from "./ModuleManagement";

export function AdminSystemSettings() {
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoBackups: true,
    userRegistration: true,
    emailNotifications: true,
    auditLogging: true,
    sessionTimeout: "8",
    maxFileSize: "10",
    backupRetention: "30",
    logLevel: "info",
    systemName: "Facility Management System",
    adminEmail: "admin@facility.com",
    welcomeMessage: "Welcome to the Facility Management System"
  });

  const updateSetting = (key: string, value: any) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }));
  };

  const logLevels = [
    { value: "error", label: "Error Only" },
    { value: "warn", label: "Warning & Error" },
    { value: "info", label: "Info, Warning & Error" },
    { value: "debug", label: "All Messages (Debug)" }
  ];

  return (
    <div className="space-y-6">
      {/* Module Management */}
      <ModuleManagement />

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Status & Control
          </CardTitle>
          <CardDescription>
            Monitor and control core system operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Temporarily disable system access for maintenance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={systemSettings.maintenanceMode ? "destructive" : "secondary"}>
                {systemSettings.maintenanceMode ? "Active" : "Inactive"}
              </Badge>
              <Switch
                checked={systemSettings.maintenanceMode}
                onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">System Name</Label>
              <Input
                value={systemSettings.systemName}
                onChange={(e) => updateSetting("systemName", e.target.value)}
                placeholder="Enter system name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Admin Email</Label>
              <Input
                type="email"
                value={systemSettings.adminEmail}
                onChange={(e) => updateSetting("adminEmail", e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Welcome Message</Label>
            <Textarea
              value={systemSettings.welcomeMessage}
              onChange={(e) => updateSetting("welcomeMessage", e.target.value)}
              placeholder="Enter welcome message for users"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Access Control
          </CardTitle>
          <CardDescription>
            Configure security policies and access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">User Registration</Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to register for accounts
              </p>
            </div>
            <Switch
              checked={systemSettings.userRegistration}
              onCheckedChange={(checked) => updateSetting("userRegistration", checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Session Timeout (hours)</Label>
              <Select
                value={systemSettings.sessionTimeout}
                onValueChange={(value) => updateSetting("sessionTimeout", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Max File Upload (MB)</Label>
              <Select
                value={systemSettings.maxFileSize}
                onValueChange={(value) => updateSetting("maxFileSize", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 MB</SelectItem>
                  <SelectItem value="10">10 MB</SelectItem>
                  <SelectItem value="25">25 MB</SelectItem>
                  <SelectItem value="50">50 MB</SelectItem>
                  <SelectItem value="100">100 MB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup & Data Management
          </CardTitle>
          <CardDescription>
            Configure automated backups and data retention policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">
                Enable scheduled database backups
              </p>
            </div>
            <Switch
              checked={systemSettings.autoBackups}
              onCheckedChange={(checked) => updateSetting("autoBackups", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Backup Retention (days)</Label>
            <Select
              value={systemSettings.backupRetention}
              onValueChange={(value) => updateSetting("backupRetention", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Create Backup Now
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              View Backup History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications & Logging */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications & Logging
          </CardTitle>
          <CardDescription>
            Configure system notifications and audit logging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send system notifications via email
              </p>
            </div>
            <Switch
              checked={systemSettings.emailNotifications}
              onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Audit Logging</Label>
              <p className="text-sm text-muted-foreground">
                Track user actions and system changes
              </p>
            </div>
            <Switch
              checked={systemSettings.auditLogging}
              onCheckedChange={(checked) => updateSetting("auditLogging", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Log Level</Label>
            <Select
              value={systemSettings.logLevel}
              onValueChange={(value) => updateSetting("logLevel", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {logLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Maintenance
          </CardTitle>
          <CardDescription>
            Perform system maintenance and cleanup operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Clear System Cache
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Optimize Database
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clean Inactive Sessions
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Archive Old Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium">Save Configuration</p>
              <p className="text-sm text-muted-foreground">
                Save all system settings changes
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                Reset to Defaults
              </Button>
              <Button>
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}