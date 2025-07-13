import { createContext, useContext, useEffect, useState } from "react";

export type ThemeVariant = "light" | "dark" | "blue" | "green" | "purple" | "system";
export type FontSize = "small" | "medium" | "large";
export type LayoutDensity = "compact" | "comfortable" | "spacious";

interface ThemeSettings {
  variant: ThemeVariant;
  fontSize: FontSize;
  layoutDensity: LayoutDensity;
  reducedMotion: boolean;
  highContrast: boolean;
}

interface EnhancedThemeContextType {
  settings: ThemeSettings;
  updateSettings: (updates: Partial<ThemeSettings>) => void;
  resetToDefaults: () => void;
}

const defaultSettings: ThemeSettings = {
  variant: "system",
  fontSize: "medium",
  layoutDensity: "comfortable",
  reducedMotion: false,
  highContrast: false,
};

const EnhancedThemeContext = createContext<EnhancedThemeContextType>({
  settings: defaultSettings,
  updateSettings: () => null,
  resetToDefaults: () => null,
});

export function EnhancedThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("enhanced-theme-settings");
      return saved ? JSON.parse(saved) : defaultSettings;
    }
    return defaultSettings;
  });

  const updateSettings = (updates: Partial<ThemeSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  useEffect(() => {
    localStorage.setItem("enhanced-theme-settings", JSON.stringify(settings));
    
    const root = document.documentElement;
    
    // Apply theme variant
    const actualTheme = settings.variant === "system" 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light")
      : settings.variant;
    
    root.classList.remove("light", "dark", "blue", "green", "purple");
    root.classList.add(actualTheme);
    
    // Apply font size
    root.classList.remove("text-sm", "text-base", "text-lg");
    const fontSizeClass = {
      small: "text-sm",
      medium: "text-base", 
      large: "text-lg"
    }[settings.fontSize];
    root.classList.add(fontSizeClass);
    
    // Apply layout density
    root.classList.remove("density-compact", "density-comfortable", "density-spacious");
    root.classList.add(`density-${settings.layoutDensity}`);
    
    // Apply accessibility preferences
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
    }
    
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
  }, [settings]);

  return (
    <EnhancedThemeContext.Provider value={{ settings, updateSettings, resetToDefaults }}>
      {children}
    </EnhancedThemeContext.Provider>
  );
}

export const useEnhancedTheme = () => {
  const context = useContext(EnhancedThemeContext);
  if (!context) {
    throw new Error("useEnhancedTheme must be used within an EnhancedThemeProvider");
  }
  return context;
};