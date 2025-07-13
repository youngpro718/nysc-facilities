import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Database, 
  Activity, 
  Users, 
  Lock, 
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react";

interface SystemSecurityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SystemSecurityModal({ open, onOpenChange }: SystemSecurityModalProps) {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    adminNotifications: true,
    securityLogging: true,
    automaticBackups: true,
    sessionTimeout: 30,
    passwordPolicy: true
  });
  const [systemStatus, setSystemStatus] = useState({
    lastBackup: '2024-01-13T10:30:00Z',
    activeUsers: 42,
    securityAlerts: 0,
    systemHealth: 'healthy'
  });
  const { toast } = useToast();

  const handleSettingChange = async (setting: string, value: boolean | number) => {
    try {
      setSettings(prev => ({ ...prev, [setting]: value }));
      
      // Here you would typically save to your backend
      toast({
        title: "Setting Updated",
        description: `${setting} has been ${typeof value === 'boolean' ? (value ? 'enabled' : 'disabled') : 'updated'}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive"
      });
    }
  };

  const securityCards = [
    {
      title: "System Health",
      icon: CheckCircle2,
      status: systemStatus.systemHealth,
      value: "All systems operational",
      color: "text-green-600"
    },
    {
      title: "Active Users",
      icon: Users,
      status: "normal",
      value: systemStatus.activeUsers,
      color: "text-blue-600"
    },
    {
      title: "Security Alerts",
      icon: AlertTriangle,
      status: systemStatus.securityAlerts > 0 ? "warning" : "normal",
      value: systemStatus.securityAlerts,
      color: systemStatus.securityAlerts > 0 ? "text-red-600" : "text-green-600"
    },
    {
      title: "Last Backup",
      icon: Database,
      status: "normal",
      value: new Date(systemStatus.lastBackup).toLocaleDateString(),
      color: "text-gray-600"
    }
  ];

  const securitySettings = [
    {
      id: 'maintenanceMode',
      title: 'Maintenance Mode',
      description: 'Enable system-wide maintenance mode',
      type: 'toggle' as const,
      value: settings.maintenanceMode,
      icon: Lock,
      critical: true
    },
    {
      id: 'adminNotifications',
      title: 'Admin Notifications',
      description: 'Receive system alerts and security notifications',
      type: 'toggle' as const,
      value: settings.adminNotifications,
      icon: Activity
    },
    {
      id: 'securityLogging',
      title: 'Security Logging',
      description: 'Log all security-related events',
      type: 'toggle' as const,
      value: settings.securityLogging,
      icon: Shield
    },
    {
      id: 'automaticBackups',
      title: 'Automatic Backups',
      description: 'Enable daily automatic database backups',
      type: 'toggle' as const,
      value: settings.automaticBackups,
      icon: Database
    },
    {
      id: 'passwordPolicy',
      title: 'Strong Password Policy',
      description: 'Enforce strong password requirements',
      type: 'toggle' as const,
      value: settings.passwordPolicy,
      icon: Lock
    }
  ];

  const performBackup = async () => {
    try {
      toast({
        title: "Backup Started",
        description: "Database backup is now in progress..."
      });
      
      // Here you would trigger actual backup
      setTimeout(() => {
        toast({
          title: "Backup Complete",
          description: "Database backup completed successfully"
        });
      }, 3000);
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to complete database backup",
        variant: "destructive"
      });
    }
  };

  const clearSecurityLogs = async () => {
    try {
      toast({
        title: "Security Logs Cleared",
        description: "All security logs have been cleared"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear security logs",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Security & Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* System Status Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {securityCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="p-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${card.color}`} />
                    <div>
                      <div className="text-sm font-medium">{card.title}</div>
                      <div className="text-lg font-bold">{card.value}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Security Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
            <div className="space-y-4">
              {securitySettings.map((setting) => {
                const Icon = setting.icon;
                return (
                  <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {setting.title}
                          {setting.critical && (
                            <Badge variant="destructive" className="text-xs">Critical</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {setting.description}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={setting.value}
                      onCheckedChange={(checked) => handleSettingChange(setting.id, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button onClick={performBackup} className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Backup Database
              </Button>
              <Button variant="outline" onClick={clearSecurityLogs} className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Clear Security Logs
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                View Activity Logs
              </Button>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}