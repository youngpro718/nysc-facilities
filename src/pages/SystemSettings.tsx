import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Settings, Database, Server, Shield, Activity, HardDrive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSystemSettings } from "@/components/profile/AdminSystemSettings";
import { DatabaseSection } from "@/components/profile/DatabaseSection";
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system" className="gap-2">
            <Settings className="h-4 w-4" />
            System Configuration
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2">
            <Database className="h-4 w-4" />
            Database Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Configure system-wide settings, maintenance mode, and operational parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminSystemSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Management
              </CardTitle>
              <CardDescription>
                Manage database operations, backups, and performance optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DatabaseSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks and system operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => runHealthCheck()}
              disabled={isRunningHealthCheck}
            >
              <Activity className={`h-6 w-6 ${isRunningHealthCheck ? 'animate-spin' : ''}`} />
              <div className="text-center">
                <p className="font-medium">
                  {isRunningHealthCheck ? 'Running...' : 'System Health Check'}
                </p>
                <p className="text-xs text-muted-foreground">Run diagnostic tests</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => backupDatabase()}
              disabled={isBackingUp}
            >
              <HardDrive className={`h-6 w-6 ${isBackingUp ? 'animate-pulse' : ''}`} />
              <div className="text-center">
                <p className="font-medium">
                  {isBackingUp ? 'Backing up...' : 'Database Backup'}
                </p>
                <p className="text-xs text-muted-foreground">Create manual backup</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => clearCache()}
              disabled={isClearingCache}
            >
              <Settings className={`h-6 w-6 ${isClearingCache ? 'animate-spin' : ''}`} />
              <div className="text-center">
                <p className="font-medium">
                  {isClearingCache ? 'Clearing...' : 'Clear Cache'}
                </p>
                <p className="text-xs text-muted-foreground">Reset system cache</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
