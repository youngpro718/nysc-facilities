import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Package,
  KeyRound,
  Wrench,
  Boxes,
} from "lucide-react";
import { useSystemSettings } from "@features/admin/hooks/useSystemSettings";

/**
 * Only the modules that are actually enforced by ModuleProtectedRoute.
 * Keys not listed here have no effect anywhere in the app, so showing
 * a switch for them would be lying to the admin.
 */
const ENFORCED_MODULES = [
  {
    key: "spaces",
    title: "Spaces",
    description: "Buildings, floors, and room management",
    icon: Building2,
  },
  {
    key: "operations",
    title: "Operations",
    description: "Issues, maintenance, and lighting",
    icon: Wrench,
  },
  {
    key: "inventory",
    title: "Inventory",
    description: "Stock levels, supplies, and storage rooms",
    icon: Boxes,
  },
  {
    key: "keys",
    title: "Keys",
    description: "Key inventory, assignments, and elevator passes",
    icon: KeyRound,
  },
  {
    key: "supply_requests",
    title: "Supply Requests",
    description: "Request approval and fulfillment",
    icon: Package,
  },
] as const;

export function ModuleManagement() {
  const { modules, toggleModule, isTogglingModule, modulesLoading } = useSystemSettings();

  if (modulesLoading) {
    return (
      <div className="space-y-3">
        {ENFORCED_MODULES.map((m) => (
          <Skeleton key={m.key} className="h-[68px] rounded-lg" />
        ))}
      </div>
    );
  }

  const enabledByKey = new Map(modules.map((m) => [m.id, m.enabled]));

  return (
    <div className="space-y-3">
      {ENFORCED_MODULES.map((module) => {
        const Icon = module.icon;
        const enabled = enabledByKey.get(module.key) ?? true;

        return (
          <div
            key={module.key}
            className="flex items-center justify-between gap-3 p-4 border rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`p-2 rounded-md shrink-0 ${enabled ? "bg-primary/10" : "bg-muted"}`}>
                <Icon className={`h-4 w-4 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="min-w-0">
                <Label className="text-sm font-medium">{module.title}</Label>
                <p className="text-sm text-muted-foreground truncate">{module.description}</p>
              </div>
            </div>
            {!enabled && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                Hidden
              </Badge>
            )}
            <Switch
              className="shrink-0"
              checked={enabled}
              onCheckedChange={(checked) => toggleModule({ moduleId: module.key, enabled: checked })}
              disabled={isTogglingModule}
            />
          </div>
        );
      })}
    </div>
  );
}
