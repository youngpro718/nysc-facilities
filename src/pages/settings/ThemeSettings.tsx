import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Sun, Moon, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/providers/ThemeProvider";

export default function ThemeSettings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      value: "light",
      label: "Light",
      description: "Use light theme",
      icon: Sun
    },
    {
      value: "dark", 
      label: "Dark",
      description: "Use dark theme",
      icon: Moon
    },
    {
      value: "system",
      label: "System",
      description: "Follow system preference",
      icon: Monitor
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-20">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9 sm:h-10 sm:w-10"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-semibold">Theme Settings</h1>
      </div>

      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Choose your theme</h2>
        <div className="space-y-3">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isSelected = theme === themeOption.value;
            
            return (
              <div
                key={themeOption.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setTheme(themeOption.value as any)}
              >
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1">
                  <div className="font-medium text-sm">{themeOption.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {themeOption.description}
                  </div>
                </div>

                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}