import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardCustomization } from "@/providers/DashboardCustomizationProvider";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Eye, EyeOff, RotateCcw, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function DashboardCustomization() {
  const {
    layouts,
    activeLayoutId,
    getActiveLayout,
    setActiveLayout,
    toggleWidget,
    resetToDefault,
  } = useDashboardCustomization();

  const activeLayout = getActiveLayout();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Dashboard Layout
          </CardTitle>
          <CardDescription>
            Choose how your dashboard is organized
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Layout Style</Label>
              <Select
                value={activeLayoutId}
                onValueChange={setActiveLayout}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {layouts.map((layout) => (
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

            {activeLayout && (
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">
                    {activeLayout.columns} columns
                  </Badge>
                  <Badge variant="outline">
                    {activeLayout.widgets.filter(w => w.enabled).length} widgets active
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {activeLayout && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Widget Configuration
            </CardTitle>
            <CardDescription>
              Control which widgets appear on your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeLayout.widgets.map((widget, index) => (
                <div key={widget.id}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{widget.name}</Label>
                      <p className="text-sm text-muted-foreground">
                        {widget.description}
                      </p>
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
                  {index < activeLayout.widgets.length - 1 && (
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
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common dashboard customization options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Button
              variant="outline"
              onClick={() => setActiveLayout("default")}
              disabled={activeLayoutId === "default"}
            >
              Switch to Default Layout
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveLayout("compact")}
              disabled={activeLayoutId === "compact"}
            >
              Switch to Compact Layout
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveLayout("minimal")}
              disabled={activeLayoutId === "minimal"}
            >
              Switch to Minimal Layout
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset Dashboard</CardTitle>
          <CardDescription>
            Restore all dashboard settings to their default configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={resetToDefault}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}