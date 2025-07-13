import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardCustomization } from "@/providers/DashboardCustomizationProvider";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Eye, EyeOff, RotateCcw, Settings, BarChart3, Users, Building, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const adminWidgets = [
  {
    id: "system-overview",
    name: "System Overview",
    description: "Key system metrics and health status",
    enabled: true,
    position: { row: 0, col: 0 },
    size: { width: 2, height: 1 }
  },
  {
    id: "user-management",
    name: "User Management",
    description: "Active users and permission management",
    enabled: true,
    position: { row: 0, col: 2 },
    size: { width: 2, height: 1 }
  },
  {
    id: "building-status",
    name: "Building Status",
    description: "Building and facility status overview",
    enabled: true,
    position: { row: 1, col: 0 },
    size: { width: 2, height: 1 }
  },
  {
    id: "maintenance-alerts",
    name: "Maintenance Alerts",
    description: "Critical maintenance and issue notifications",
    enabled: true,
    position: { row: 1, col: 2 },
    size: { width: 2, height: 1 }
  },
  {
    id: "analytics-summary",
    name: "Analytics Summary",
    description: "Usage analytics and reporting dashboard",
    enabled: true,
    position: { row: 2, col: 0 },
    size: { width: 4, height: 1 }
  },
  {
    id: "quick-admin-actions",
    name: "Admin Quick Actions",
    description: "Frequently used administrative functions",
    enabled: true,
    position: { row: 3, col: 0 },
    size: { width: 4, height: 1 }
  },
  {
    id: "recent-activity",
    name: "Recent System Activity",
    description: "Latest system logs and user activity",
    enabled: false,
    position: { row: 4, col: 0 },
    size: { width: 4, height: 1 }
  }
];

const adminLayouts = [
  {
    id: "admin-default",
    name: "Admin Default",
    description: "Comprehensive admin dashboard with all key widgets",
    columns: 4,
    widgets: adminWidgets
  },
  {
    id: "admin-compact",
    name: "Admin Compact",
    description: "Essential admin widgets in a condensed layout",
    columns: 2,
    widgets: adminWidgets.filter(w => ["system-overview", "user-management", "maintenance-alerts", "quick-admin-actions"].includes(w.id))
  },
  {
    id: "admin-monitoring",
    name: "Monitoring Focus",
    description: "Dashboard optimized for system monitoring",
    columns: 3,
    widgets: adminWidgets.filter(w => ["system-overview", "building-status", "maintenance-alerts", "analytics-summary", "recent-activity"].includes(w.id))
  },
  {
    id: "admin-minimal",
    name: "Admin Minimal",
    description: "Streamlined view with only critical information",
    columns: 2,
    widgets: adminWidgets.filter(w => ["system-overview", "maintenance-alerts"].includes(w.id))
  }
];

export function AdminDashboardCustomization() {
  const {
    layouts,
    activeLayoutId,
    getActiveLayout,
    setActiveLayout,
    addLayout,
    toggleWidget,
    resetToDefault,
  } = useDashboardCustomization();

  // Initialize admin layouts if not present
  const initializeAdminLayouts = () => {
    const hasAdminLayouts = layouts.some(layout => layout.id.startsWith('admin-'));
    if (!hasAdminLayouts) {
      adminLayouts.forEach(adminLayout => {
        addLayout(adminLayout);
      });
      setActiveLayout('admin-default');
    }
  };

  // Initialize admin layouts on component mount
  React.useEffect(() => {
    initializeAdminLayouts();
  }, []);

  const currentActiveLayout = getActiveLayout() || adminLayouts[0];

  const getWidgetIcon = (widgetId: string) => {
    switch (widgetId) {
      case "system-overview": return <Settings className="h-4 w-4" />;
      case "user-management": return <Users className="h-4 w-4" />;
      case "building-status": return <Building className="h-4 w-4" />;
      case "maintenance-alerts": return <AlertTriangle className="h-4 w-4" />;
      case "analytics-summary": return <BarChart3 className="h-4 w-4" />;
      default: return <LayoutGrid className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Admin Dashboard Layout
          </CardTitle>
          <CardDescription>
            Configure your administrative dashboard layout and widgets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Layout Style</Label>
              <Select
                value={activeLayoutId.startsWith('admin-') ? activeLayoutId : 'admin-default'}
                onValueChange={setActiveLayout}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {adminLayouts.map((layout) => (
                    <SelectItem key={layout.id} value={layout.id}>
                      <div>
                        <div className="font-medium">{layout.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {layout.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentActiveLayout && (
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">
                    {currentActiveLayout.columns} columns
                  </Badge>
                  <Badge variant="outline">
                    {currentActiveLayout.widgets.filter(w => w.enabled).length} widgets active
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {currentActiveLayout && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Admin Widget Configuration
            </CardTitle>
            <CardDescription>
              Control which administrative widgets appear on your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentActiveLayout.widgets.map((widget, index) => (
                <div key={widget.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getWidgetIcon(widget.id)}
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">{widget.name}</Label>
                        <p className="text-sm text-muted-foreground">
                          {widget.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWidget(widget.id)}
                        className="h-8 w-8 p-0"
                      >
                        {widget.enabled ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Switch
                        checked={widget.enabled}
                        onCheckedChange={() => toggleWidget(widget.id)}
                      />
                    </div>
                  </div>
                  {index < currentActiveLayout.widgets.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Admin Layout Presets</CardTitle>
          <CardDescription>
            Quickly switch between optimized admin dashboard layouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Button
              variant="outline"
              onClick={() => setActiveLayout("admin-default")}
              disabled={activeLayoutId === "admin-default"}
              className="justify-start"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Full Admin Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveLayout("admin-monitoring")}
              disabled={activeLayoutId === "admin-monitoring"}
              className="justify-start"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Monitoring Focus
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveLayout("admin-compact")}
              disabled={activeLayoutId === "admin-compact"}
              className="justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Essential Admin View
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveLayout("admin-minimal")}
              disabled={activeLayoutId === "admin-minimal"}
              className="justify-start"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Critical Alerts Only
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset Admin Dashboard</CardTitle>
          <CardDescription>
            Restore all admin dashboard settings to their default configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={resetToDefault}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Admin Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}