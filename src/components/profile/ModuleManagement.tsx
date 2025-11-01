import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  AlertTriangle, 
  Users, 
  Package, 
  KeyRound, 
  Zap, 
  Wrench, 
  Gavel,
  Boxes,
  Settings2
} from "lucide-react";
import { useSystemSettings } from "@/hooks/admin/useSystemSettings";

const MODULE_CONFIG = [
  {
    key: 'spaces' as const,
    title: 'Spaces Management',
    description: 'Manage buildings, floors, rooms, and space layouts',
    icon: Building2,
  },
  {
    key: 'operations' as const,
    title: 'Operations',
    description: 'Consolidated Issues, Maintenance, and Supply Requests',
    icon: AlertTriangle,
  },
  {
    key: 'issues' as const,
    title: 'Issues Management',
    description: 'Track and resolve facility issues and maintenance requests',
    icon: AlertTriangle,
  },
  {
    key: 'occupants' as const,
    title: 'Occupants Management',
    description: 'Manage room assignments and occupant information',
    icon: Users,
  },
  {
    key: 'inventory' as const,
    title: 'Inventory Management',
    description: 'Track inventory items, stock levels, and transactions',
    icon: Boxes,
  },
  {
    key: 'supply_requests' as const,
    title: 'Supply Requests',
    description: 'Process and fulfill supply and material requests',
    icon: Package,
  },
  {
    key: 'keys' as const,
    title: 'Keys Management',
    description: 'Manage key requests, assignments, and inventory',
    icon: KeyRound,
  },
  {
    key: 'lighting' as const,
    title: 'Lighting Management',
    description: 'Monitor and maintain lighting fixtures and systems',
    icon: Zap,
  },
  {
    key: 'maintenance' as const,
    title: 'Maintenance Management',
    description: 'Schedule and track facility maintenance operations',
    icon: Wrench,
  },
  {
    key: 'court_operations' as const,
    title: 'Court Operations',
    description: 'Manage court assignments, terms, and operations',
    icon: Gavel,
  },
];

export function ModuleManagement() {
  const { modules, toggleModule, isTogglingModule, modulesLoading } = useSystemSettings();

  const handleModuleToggle = (moduleId: string, enabled: boolean) => {
    toggleModule({ moduleId, enabled });
  };

  const getActiveModulesCount = () => {
    return modules.filter(module => module.enabled).length;
  };

  if (modulesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Module Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading module preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Module Management
        </CardTitle>
        <CardDescription>
          Control which modules are enabled for your admin interface. Disabling unused modules can improve performance.
        </CardDescription>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">
            {getActiveModulesCount()}/{modules.length} modules enabled
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {modules.map((module) => {
            // Find matching config for icon
            const config = MODULE_CONFIG.find(c => c.key === module.id);
            const Icon = config?.icon || Settings2;
            
            return (
              <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-md ${module.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-4 w-4 ${module.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">{module.name}</Label>
                      <Badge variant={module.enabled ? "default" : "secondary"} className="text-xs">
                        {module.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={module.enabled}
                  onCheckedChange={(checked) => handleModuleToggle(module.id, checked)}
                  disabled={isTogglingModule}
                />
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          <div className="space-y-0.5">
            <p className="font-medium">Module Preferences</p>
            <p className="text-sm text-muted-foreground">
              Changes are saved automatically and take effect immediately
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}