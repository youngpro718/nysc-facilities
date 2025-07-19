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
import { useEnabledModules } from "@/hooks/useEnabledModules";

const MODULE_CONFIG = [
  {
    key: 'spaces' as const,
    title: 'Spaces Management',
    description: 'Manage buildings, floors, rooms, and space layouts',
    icon: Building2,
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
  const { enabledModules, loading, updateEnabledModules, resetToDefaults } = useEnabledModules();

  const handleModuleToggle = (moduleKey: keyof typeof enabledModules, enabled: boolean) => {
    updateEnabledModules({ [moduleKey]: enabled });
  };

  const getActiveModulesCount = () => {
    return Object.values(enabledModules).filter(Boolean).length;
  };

  if (loading) {
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
            {getActiveModulesCount()}/{MODULE_CONFIG.length} modules enabled
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {MODULE_CONFIG.map((module) => {
            const Icon = module.icon;
            const isEnabled = enabledModules[module.key];
            
            return (
              <div key={module.key} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-md ${isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-4 w-4 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">{module.title}</Label>
                      <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
                        {isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleModuleToggle(module.key, checked)}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-0.5">
            <p className="font-medium">Module Preferences</p>
            <p className="text-sm text-muted-foreground">
              Changes are saved automatically and take effect immediately
            </p>
          </div>
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}