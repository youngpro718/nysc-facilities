import { createContext, useContext, useEffect, useState } from "react";

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
  }
];

const DashboardCustomizationContext = createContext<DashboardCustomizationContextType>({
  layouts: defaultLayouts,
  activeLayoutId: "default",
  getActiveLayout: () => undefined,
  updateLayout: () => null,
  setActiveLayout: () => null,
  toggleWidget: () => null,
  resetToDefault: () => null,
});

export function DashboardCustomizationProvider({ children }: { children: React.ReactNode }) {
  const [layouts, setLayouts] = useState<DashboardLayout[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("dashboard-layouts");
      return saved ? JSON.parse(saved) : defaultLayouts;
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

  const setActiveLayout = (layoutId: string) => {
    setActiveLayoutId(layoutId);
  };

  const toggleWidget = (widgetId: string) => {
    const activeLayout = getActiveLayout();
    if (!activeLayout) return;

    const updatedWidgets = activeLayout.widgets.map(widget =>
      widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget
    );

    updateLayout(activeLayout.id, { widgets: updatedWidgets });
  };

  const resetToDefault = () => {
    setLayouts(defaultLayouts);
    setActiveLayoutId("default");
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