import React, { createContext, useContext, useState, ReactNode } from 'react';

// Simplified types
interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  position: { row: number; col: number };
  size: { width: number; height: number };
}

interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  columns: number;
  widgets: DashboardWidget[];
}

interface DashboardContextType {
  layouts: DashboardLayout[];
  activeLayoutId: string;
  getActiveLayout: () => DashboardLayout | undefined;
  updateLayout: (layoutId: string, updates: Partial<DashboardLayout>) => void;
  addLayout: (layout: DashboardLayout) => void;
  setActiveLayout: (layoutId: string) => void;
  toggleWidget: (widgetId: string) => void;
  resetToDefault: () => void;
}

// Simple default widgets
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
  }
];

// Simple default layouts
const defaultLayouts: DashboardLayout[] = [
  {
    id: "default",
    name: "Default Layout",
    description: "Standard grid layout with all widgets",
    columns: 4,
    widgets: defaultWidgets
  }
];

// Create context with safe defaults
const DashboardCustomizationContext = createContext<DashboardContextType>({
  layouts: defaultLayouts,
  activeLayoutId: "default",
  getActiveLayout: () => defaultLayouts[0],
  updateLayout: () => {},
  addLayout: () => {},
  setActiveLayout: () => {},
  toggleWidget: () => {},
  resetToDefault: () => {},
});

export const useDashboardCustomization = () => {
  const context = useContext(DashboardCustomizationContext);
  if (!context) {
    throw new Error('useDashboardCustomization must be used within a DashboardCustomizationProvider');
  }
  return context;
};

export function SimpleDashboardProvider({ children }: { children: ReactNode }) {
  const [layouts] = useState<DashboardLayout[]>(defaultLayouts);
  const [activeLayoutId] = useState<string>("default");

  const getActiveLayout = () => {
    const layout = layouts.find(l => l.id === activeLayoutId);
    return layout || defaultLayouts[0];
  };

  const updateLayout = () => {
    // Simplified - no-op for now
  };

  const addLayout = () => {
    // Simplified - no-op for now
  };

  const setActiveLayout = () => {
    // Simplified - no-op for now
  };

  const toggleWidget = () => {
    // Simplified - no-op for now
  };

  const resetToDefault = () => {
    // Simplified - no-op for now
  };

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

export default SimpleDashboardProvider;
