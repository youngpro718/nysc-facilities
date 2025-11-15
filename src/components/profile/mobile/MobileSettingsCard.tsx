import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Smartphone,
  Moon,
  Sun,
  Volume2,
  VolumeX
} from "lucide-react";
import { useState } from "react";

interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  type: 'toggle' | 'navigation' | 'selection';
  value?: boolean | string;
  options?: string[];
  badge?: string;
  action?: () => void;
  onChange?: (value: boolean | string) => void;
}

interface MobileSettingsCardProps {
  title: string;
  description?: string;
  settings: SettingItem[];
}

export function MobileSettingsCard({ title, description, settings }: MobileSettingsCardProps) {
  const [localValues, setLocalValues] = useState<Record<string, boolean | string>>({});

  const getValue = (setting: SettingItem) => {
    return localValues[setting.id] ?? setting.value ?? false;
  };

  const handleToggle = (setting: SettingItem, value: boolean) => {
    setLocalValues(prev => ({ ...prev, [setting.id]: value }));
    setting.onChange?.(value);
  };

  const renderSettingControl = (setting: SettingItem) => {
    switch (setting.type) {
      case 'toggle':
        return (
          <Switch
            checked={getValue(setting) as boolean}
            onCheckedChange={(value) => handleToggle(setting, value)}
          />
        );
      case 'navigation':
        return (
          <div className="flex items-center gap-2">
            {setting.badge && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {setting.badge}
              </Badge>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        );
      case 'selection':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {getValue(setting) as string}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 pb-2">
        <h3 className="font-semibold text-base">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="divide-y">
        {settings.map((setting, index) => (
          <div key={setting.id} className="p-4">
            <div 
              className={`flex items-center gap-3 ${
                (setting.type === 'navigation' || setting.type === 'selection') && setting.action ? 'cursor-pointer' : ''
              }`}
              onClick={() => {
                if ((setting.type === 'navigation' || setting.type === 'selection') && setting.action) {
                  setting.action();
                }
              }}
            >
              <div className="p-2 rounded-lg bg-muted">
                <setting.icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{setting.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {setting.description}
                </div>
              </div>

              {renderSettingControl(setting)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}