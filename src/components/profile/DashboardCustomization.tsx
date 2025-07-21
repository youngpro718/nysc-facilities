import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutGrid, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Settings, 
  Monitor,
  Smartphone,
  Tablet,
  Grid3X3,
  List,
  BarChart3,
  Calendar,
  Users,
  Building,
  Package,
  Wrench,
  Key,
  Lightbulb,
  Save
} from "lucide-react";

interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'analytics' | 'operations' | 'facilities' | 'admin';
  enabled: boolean;
  position: { x: number; y: number; w: number; h: number };
}

interface DashboardSettings {
  layout: 'grid' | 'list' | 'compact';
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number;
  showNotifications: boolean;
  compactMode: boolean;
  widgets: DashboardWidget[];
  columns: number;
}

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'overview',
    name: 'System Overview',
    description: 'Key metrics and system status',
    icon: BarChart3,
    category: 'analytics',
    enabled: true,
    position: { x: 0, y: 0, w: 2, h: 1 }
  },
  {
    id: 'recent-issues',
    name: 'Recent Issues',
    description: 'Latest facility issues and reports',
    icon: Building,
    category: 'facilities',
    enabled: true,
    position: { x: 2, y: 0, w: 2, h: 1 }
  },
  {
    id: 'supply-requests',
    name: 'Supply Requests',
    description: 'Pending and recent supply requests',
    icon: Package,
    category: 'operations',
    enabled: true,
    position: { x: 0, y: 1, w: 1, h: 1 }
  },
  {
    id: 'maintenance',
    name: 'Maintenance Tasks',
    description: 'Scheduled and pending maintenance',
    icon: Wrench,
    category: 'operations',
    enabled: true,
    position: { x: 1, y: 1, w: 1, h: 1 }
  },
  {
    id: 'key-management',
    name: 'Key Management',
    description: 'Key requests and assignments',
    icon: Key,
    category: 'operations',
    enabled: false,
    position: { x: 2, y: 1, w: 1, h: 1 }
  },
  {
    id: 'lighting',
    name: 'Lighting Control',
    description: 'Lighting status and controls',
    icon: Lightbulb,
    category: 'facilities',
    enabled: false,
    position: { x: 3, y: 1, w: 1, h: 1 }
  },
  {
    id: 'users',
    name: 'User Management',
    description: 'User roles and permissions',
    icon: Users,
    category: 'admin',
    enabled: false,
    position: { x: 0, y: 2, w: 2, h: 1 }
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Upcoming events and schedules',
    icon: Calendar,
    category: 'operations',
    enabled: false,
    position: { x: 2, y: 2, w: 2, h: 1 }
  }
];

const defaultSettings: DashboardSettings = {
  layout: 'grid',
  theme: 'auto',
  refreshInterval: 30,
  showNotifications: true,
  compactMode: false,
  widgets: defaultWidgets,
  columns: 4
};

export function DashboardCustomization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    loadDashboardSettings();
  }, [user]);

  const loadDashboardSettings = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data && (data as any).dashboard_settings) {
        setSettings({ ...defaultSettings, ...(data as any).dashboard_settings });
      }
    } catch (error) {
      console.error('Error loading dashboard settings:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveDashboardSettings = async () => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          dashboard_settings: settings,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', user.id);

      if (error) throw error;

      setHasChanges(false);
      toast({
        title: "Success",
        description: "Dashboard settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving dashboard settings:', error);
      toast({
        title: "Error",
        description: "Failed to save dashboard settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleWidget = (widgetId: string) => {
    setSettings(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget
      )
    }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast({
      title: "Settings Reset",
      description: "Dashboard settings have been reset to defaults",
    });
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile': return { width: '375px', height: '200px' };
      case 'tablet': return { width: '768px', height: '300px' };
      default: return { width: '100%', height: '400px' };
    }
  };

  const categorizedWidgets = {
    analytics: settings.widgets.filter(w => w.category === 'analytics'),
    operations: settings.widgets.filter(w => w.category === 'operations'),
    facilities: settings.widgets.filter(w => w.category === 'facilities'),
    admin: settings.widgets.filter(w => w.category === 'admin')
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Customization</h2>
          <p className="text-muted-foreground">Customize your dashboard layout and widgets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={saveDashboardSettings} 
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Layout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Layout Configuration
          </CardTitle>
          <CardDescription>
            Configure your dashboard layout and appearance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">Layout Style</Label>
              <Select
                value={settings.layout}
                onValueChange={(value: 'grid' | 'list' | 'compact') => updateSetting('layout', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">
                    <div className="flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Grid Layout</div>
                        <div className="text-sm text-muted-foreground">Organized in a responsive grid</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="list">
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      <div>
                        <div className="font-medium">List Layout</div>
                        <div className="text-sm text-muted-foreground">Vertical list arrangement</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="compact">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Compact Layout</div>
                        <div className="text-sm text-muted-foreground">Dense information display</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(value: 'light' | 'dark' | 'auto') => updateSetting('theme', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light Theme</SelectItem>
                  <SelectItem value="dark">Dark Theme</SelectItem>
                  <SelectItem value="auto">Auto (System)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-4 block">
              Grid Columns: {settings.columns}
            </Label>
            <Slider
              value={[settings.columns]}
              onValueChange={([value]) => updateSetting('columns', value)}
              min={2}
              max={6}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-4 block">
              Auto Refresh Interval: {settings.refreshInterval} seconds
            </Label>
            <Slider
              value={[settings.refreshInterval]}
              onValueChange={([value]) => updateSetting('refreshInterval', value)}
              min={10}
              max={300}
              step={10}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">Reduce spacing and padding</p>
            </div>
            <Switch
              checked={settings.compactMode}
              onCheckedChange={(value) => updateSetting('compactMode', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Show Notifications</Label>
              <p className="text-sm text-muted-foreground">Display notification indicators</p>
            </div>
            <Switch
              checked={settings.showNotifications}
              onCheckedChange={(value) => updateSetting('showNotifications', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Widget Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Widget Configuration
          </CardTitle>
          <CardDescription>
            Choose which widgets to display on your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(categorizedWidgets).map(([category, widgets]) => (
              <div key={category}>
                <h3 className="font-medium mb-3 capitalize flex items-center gap-2">
                  {category === 'analytics' && <BarChart3 className="h-4 w-4" />}
                  {category === 'operations' && <Settings className="h-4 w-4" />}
                  {category === 'facilities' && <Building className="h-4 w-4" />}
                  {category === 'admin' && <Users className="h-4 w-4" />}
                  {category} Widgets
                </h3>
                <div className="grid gap-3">
                  {widgets.map((widget) => {
                    const IconComponent = widget.icon;
                    return (
                      <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{widget.name}</div>
                            <div className="text-sm text-muted-foreground">{widget.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={widget.enabled}
                            onCheckedChange={() => toggleWidget(widget.id)}
                          />
                          {widget.enabled ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Dashboard Preview
              </CardTitle>
              <CardDescription>
                Preview your dashboard layout
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded-lg p-4 bg-muted/50 overflow-auto"
            style={getPreviewDimensions()}
          >
            <div className={`grid gap-4 ${settings.layout === 'grid' ? `grid-cols-${Math.min(settings.columns, previewMode === 'mobile' ? 1 : previewMode === 'tablet' ? 2 : 4)}` : 'grid-cols-1'}`}>
              {settings.widgets
                .filter(widget => widget.enabled)
                .map((widget) => {
                  const IconComponent = widget.icon;
                  return (
                    <div key={widget.id} className={`border rounded-lg bg-background ${settings.compactMode ? 'p-2' : 'p-3'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm font-medium">{widget.name}</span>
                      </div>
                      <div className="h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        Widget Content
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
