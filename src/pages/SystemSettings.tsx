import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Settings, Database, Server, Shield, Activity, HardDrive, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSystemSettings } from "@/components/profile/AdminSystemSettings";
import { DatabaseSection } from "@/components/profile/DatabaseSection";
import { SecurityAuditPanel } from "@/components/security/SecurityAuditPanel";
import { Badge } from "@/components/ui/badge";
import { useSystemSettings } from "@/hooks/admin/useSystemSettings";

export default function SystemSettings() {
  const navigate = useNavigate();
  const {
    systemStats,
    systemStatus,
    modules,
    isLoading,
    runHealthCheck,
    backupDatabase,
    clearCache,
    isRunningHealthCheck,
    isBackingUp,
    isClearingCache
  } = useSystemSettings();

  return (
    <div className="space-y-4 sm:space-y-6 pb-nav-safe">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">System Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure system-wide settings and administrative tools
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/install')}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <QrCode className="h-4 w-4" />
          <span className="hidden sm:inline">App Install</span>
        </Button>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`h-2 w-2 rounded-full ${
                    systemStatus?.system === 'online' ? 'bg-green-500' :
                    systemStatus?.system === 'maintenance' ? 'bg-orange-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium capitalize">
                    {systemStatus?.system || 'Loading...'}
                  </span>
                </div>
              </div>
              <Server className={`h-8 w-8 ${
                systemStatus?.system === 'online' ? 'text-green-500' :
                systemStatus?.system === 'maintenance' ? 'text-orange-500' : 'text-red-500'
              }`} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Database</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`h-2 w-2 rounded-full ${
                    systemStatus?.database === 'connected' ? 'bg-green-500' :
                    systemStatus?.database === 'disconnected' ? 'bg-red-500' : 'bg-orange-500'
                  }`}></div>
                  <span className="text-sm font-medium capitalize">
                    {systemStatus?.database || 'Loading...'}
                  </span>
                </div>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`h-2 w-2 rounded-full ${
                    systemStatus?.security === 'secure' ? 'bg-green-500' :
                    systemStatus?.security === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium capitalize">
                    {systemStatus?.security || 'Loading...'}
                  </span>
                </div>
              </div>
              <Shield className={`h-8 w-8 ${
                systemStatus?.security === 'secure' ? 'text-green-500' :
                systemStatus?.security === 'warning' ? 'text-orange-500' : 'text-red-500'
              }`} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
                <Badge variant={systemStatus?.maintenance === 'active' ? 'destructive' : 'secondary'}>
                  {systemStatus?.maintenance || 'Loading...'}
                </Badge>
              </div>
              <Settings className={`h-8 w-8 ${
                systemStatus?.maintenance === 'active' ? 'text-red-500' :
                systemStatus?.maintenance === 'scheduled' ? 'text-orange-500' : 'text-gray-500'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="security">Security Audit</TabsTrigger>
        </TabsList>
        
        <TabsContent value="system" className="space-y-6">
          <AdminSystemSettings />
        </TabsContent>
        
        <TabsContent value="database" className="space-y-6">
          <DatabaseSection />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <SecurityAuditPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
