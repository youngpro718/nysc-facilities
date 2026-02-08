import { createContext, useContext, useEffect, useState } from "react";
import { logger } from '@/lib/logger';

export interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  position: { row: number; col: number };
  size: { width: number; height: number };
}

export interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  columns: number;
  widgets: DashboardWidget[];
}

interface DashboardCustomizationContextType {
  layouts: DashboardLayout[];
  activeLayoutId: string;
  getActiveLayout: () => DashboardLayout | undefined;
  updateLayout: (layoutId: string, updates: Partial<DashboardLayout>) => void;
  addLayout: (layout: DashboardLayout) => void;
  setActiveLayout: (layoutId: string) => void;
  toggleWidget: (widgetId: string) => void;
  resetToDefault: () => void;
}

const defaultWidgets: DashboardWidget[] = [
  {
    id: "notifications",
    name: "Recent Notifications",
    description: "Latest system notifications and alerts",
    enabled: true,
    position: { row: 0, col: 0 },
    size: { width: 2, height: 1 }
  },
  {
    id: "assignments",
    name: "Room Assignments",
    description: "Your assigned rooms and spaces",
    enabled: true,
    position: { row: 0, col: 2 },
    size: { width: 2, height: 1 }
  },
  {
    id: "keys",
    name: "Key Assignments",
    description: "Keys assigned to you",
    enabled: true,
    position: { row: 1, col: 0 },
    size: { width: 2, height: 1 }
  },
  {
    id: "issues",
    name: "My Issues",
    description: "Issues you've reported",
    enabled: true,
    position: { row: 1, col: 2 },
    size: { width: 2, height: 1 }
  },
  {
    id: "quick-actions",
    name: "Quick Actions",
    description: "Frequently used actions",
    enabled: true,
    position: { row: 2, col: 0 },
    size: { width: 4, height: 1 }
  }
];

const adminWidgets: DashboardWidget[] = [
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

const adminLayouts: DashboardLayout[] = [
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

const defaultLayouts: DashboardLayout[] = [
  {
    id: "default",
    name: "Default Layout",
    description: "Standard grid layout with all widgets",
    columns: 4,
    widgets: defaultWidgets
  },
  {
    id: "compact",
    name: "Compact Layout", 
    description: "Condensed view with essential widgets only",
    columns: 2,
    widgets: defaultWidgets.filter(w => ["notifications", "assignments", "issues"].includes(w.id))
  },
  {
    id: "minimal",
    name: "Minimal Layout",
    description: "Clean layout with just notifications and quick actions",
    columns: 2,
    widgets: defaultWidgets.filter(w => ["notifications", "quick-actions"].includes(w.id))
  },
  ...adminLayouts
];

const DashboardCustomizationContext = createContext<DashboardCustomizationContextType>({
  layouts: defaultLayouts,
  activeLayoutId: "default",
  getActiveLayout: () => undefined,
  updateLayout: () => null,
  addLayout: () => null,
  setActiveLayout: () => null,
  toggleWidget: () => null,
  resetToDefault: () => null,
});

export function DashboardCustomizationProvider({ children }: { children: React.ReactNode }) {
  const [layouts, setLayouts] = useState<DashboardLayout[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("dashboard-layouts");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Ensure all layouts have widgets array
          return parsed.map((layout: Record<string, unknown>) => ({
            ...layout,
            widgets: Array.isArray(layout.widgets) ? layout.widgets : []
          }));
        } catch (e) {
          logger.warn('Failed to parse saved layouts, clearing localStorage and using defaults:', e);
          localStorage.removeItem("dashboard-layouts");
          localStorage.removeItem("active-dashboard-layout");
          return defaultLayouts;
        }
      }
      return defaultLayouts;
    }
    return defaultLayouts;
  });

  const [activeLayoutId, setActiveLayoutId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("active-dashboard-layout") || "default";
    }
    return "default";
  });

  const getActiveLayout = () => layouts.find(l => l.id === activeLayoutId);

  const updateLayout = (layoutId: string, updates: Partial<DashboardLayout>) => {
    setLayouts(prev => prev.map(layout => 
      layout.id === layoutId ? { ...layout, ...updates } : layout
    ));
  };

  const addLayout = (layout: DashboardLayout) => {
    setLayouts(prev => {
      const exists = prev.some(l => l.id === layout.id);
      if (exists) {
        return prev.map(l => l.id === layout.id ? layout : l);
      }
      return [...prev, layout];
    });
  };

  const setActiveLayout = (layoutId: string) => {
    setActiveLayoutId(layoutId);
  };

  const toggleWidget = (widgetId: string) => {
    const activeLayout = getActiveLayout();
    if (!activeLayout || !activeLayout.widgets) return;

    const updatedWidgets = activeLayout.widgets.map(widget =>
      widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget
    );

    updateLayout(activeLayout.id, { widgets: updatedWidgets });
  };

  const resetToDefault = () => {
    setLayouts(defaultLayouts);  
    setActiveLayoutId("admin-default");
  };

  useEffect(() => {
    localStorage.setItem("dashboard-layouts", JSON.stringify(layouts));
  }, [layouts]);

  useEffect(() => {
    localStorage.setItem("active-dashboard-layout", activeLayoutId);
  }, [activeLayoutId]);

  return (
    <DashboardCustomizationContext.Provider value={{
      layouts,
      activeLayoutId,
      getActiveLayout,
      updateLayout,
      addLayout,
      setActiveLayout,
      toggleWidget,
      resetToDefault,
    }}>
      {children}
    </DashboardCustomizationContext.Provider>
  );
}

export const useDashboardCustomization = () => {
  const context = useContext(DashboardCustomizationContext);
  if (!context) {
    throw new Error("useDashboardCustomization must be used within a DashboardCustomizationProvider");
  }
  return context;
};