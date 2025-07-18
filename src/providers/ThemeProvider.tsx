
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => null,
});

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem("theme") as Theme;
      if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
        // Apply theme immediately to prevent flash
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(savedTheme);
        return savedTheme;
      }
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add("dark");
        return "dark";
      }
      // Apply default light theme
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add("light");
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove both classes first to avoid conflicts
    root.classList.remove("light", "dark");
    
    // Add the correct theme class
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
