import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useGlobalSystemSettings } from "@/hooks/admin/useGlobalSystemSettings";
import { useToast } from "@/hooks/use-toast";
import { ModuleManagement } from "./ModuleManagement";
import { useSystemSettings } from "@/hooks/admin/useSystemSettings";

export function AdminSystemSettings() {
  const { clearCache, isClearingCache } = useSystemSettings();
  const { settings, isLoading: settingsLoading, isSaving, saveSettings } = useGlobalSystemSettings();
  const { toast } = useToast();

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    if (settings) {
      setMaintenanceMode(settings.maintenanceMode);
    }
  }, [settings]);

  const handleMaintenanceToggle = async (checked: boolean) => {
    setMaintenanceMode(checked);
    try {
      const ok = await saveSettings({ maintenanceMode: checked });
      if (ok) {
        toast({ 
          title: checked ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
          description: checked 
            ? 'Users will see a maintenance message' 
            : 'System is now accessible to all users'
        });
      }
    } catch (e) {
      toast({ title: 'Failed to update maintenance mode', variant: 'destructive' });
      setMaintenanceMode(!checked); // Revert on error
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Management */}
      <ModuleManagement />

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Control
          </CardTitle>
          <CardDescription>
            Control system-wide settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Temporarily disable system access for maintenance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={maintenanceMode ? "destructive" : "secondary"}>
                {maintenanceMode ? "Active" : "Inactive"}
              </Badge>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={handleMaintenanceToggle}
                disabled={settingsLoading || isSaving}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              onClick={() => clearCache()}
              disabled={isClearingCache}
            >
              <Trash2 className="h-4 w-4" />
              {isClearingCache ? 'Clearing Cache...' : 'Clear System Cache'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
