/**
 * QuickActionsWidget - Reusable quick action buttons for dashboards
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  path?: string;
  onClick?: () => void;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

interface QuickActionsWidgetProps {
  actions: QuickAction[];
  title?: string;
  description?: string;
  columns?: 2 | 3 | 4;
  variant?: 'default' | 'compact';
  className?: string;
}

const colorClasses = {
  blue: 'hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950',
  green: 'hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950',
  orange: 'hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950',
  red: 'hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950',
  purple: 'hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950',
};

const iconColorClasses = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  red: 'text-red-500',
  purple: 'text-purple-500',
};

export function QuickActionsWidget({ 
  actions, 
  title = "Quick Actions",
  description,
  columns = 3,
  variant = 'default',
  className 
}: QuickActionsWidgetProps) {
  const navigate = useNavigate();

  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              onClick={() => handleAction(action)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={cn("border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={cn(
          "grid gap-4",
          columns === 2 && "grid-cols-1 md:grid-cols-2",
          columns === 3 && "grid-cols-1 md:grid-cols-3",
          columns === 4 && "grid-cols-2 md:grid-cols-4",
        )}>
          {actions.map((action) => {
            const Icon = action.icon;
            const hoverClass = colorClasses[action.color || 'blue'];
            const iconClass = iconColorClasses[action.color || 'blue'];
            
            return (
              <Button
                key={action.id}
                variant="outline"
                className={cn(
                  "h-24 p-4 flex flex-col items-center gap-2 transition-colors group",
                  hoverClass
                )}
                onClick={() => handleAction(action)}
              >
                <Icon className={cn("h-8 w-8 group-hover:scale-110 transition-transform", iconClass)} />
                <div className="text-center">
                  <div className="font-semibold text-sm">{action.label}</div>
                  {action.description && (
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
