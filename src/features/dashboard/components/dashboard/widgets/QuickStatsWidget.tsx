/**
 * QuickStatsWidget - Reusable stats cards for dashboards
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  badge?: string;
  onClick?: () => void;
}

interface QuickStatsWidgetProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const colorClasses = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-red-600 dark:text-red-400',
  purple: 'text-purple-600 dark:text-purple-400',
  gray: 'text-gray-600',
};

export function QuickStatsWidget({ stats, columns = 4, className }: QuickStatsWidgetProps) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 2 && "grid-cols-2",
      columns === 3 && "grid-cols-1 sm:grid-cols-3",
      columns === 4 && "grid-cols-2 md:grid-cols-4",
      className
    )}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const colorClass = colorClasses[stat.color || 'blue'];
        
        return (
          <Card 
            key={index}
            className={cn(
              "transition-all",
              stat.onClick && "cursor-pointer hover:shadow-md"
            )}
            onClick={stat.onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn("h-5 w-5", colorClass)} />
                {stat.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {stat.badge}
                  </Badge>
                )}
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
