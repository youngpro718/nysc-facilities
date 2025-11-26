/**
 * EmptyState - Standardized empty state component
 * 
 * Use this whenever a list or section has no data to display.
 * Always includes a call-to-action when possible.
 */

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
  variant?: 'default' | 'card' | 'inline';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = 'default',
}: EmptyStateProps) {
  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      variant === 'inline' ? 'py-6' : 'py-12',
      className
    )}>
      <div className={cn(
        "rounded-full bg-muted flex items-center justify-center mb-4",
        variant === 'inline' ? 'h-10 w-10' : 'h-16 w-16'
      )}>
        <Icon className={cn(
          "text-muted-foreground",
          variant === 'inline' ? 'h-5 w-5' : 'h-8 w-8'
        )} />
      </div>
      
      <h3 className={cn(
        "font-semibold mb-2",
        variant === 'inline' ? 'text-base' : 'text-lg'
      )}>
        {title}
      </h3>
      
      <p className={cn(
        "text-muted-foreground max-w-sm",
        variant === 'inline' ? 'text-sm mb-3' : 'text-sm mb-4'
      )}>
        {description}
      </p>
      
      {action && (
        <Button 
          onClick={action.onClick}
          size={variant === 'inline' ? 'sm' : 'default'}
        >
          {action.icon && <action.icon className="h-4 w-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  );

  if (variant === 'card') {
    return <Card className="p-6">{content}</Card>;
  }

  return content;
}

/**
 * Common empty state configurations
 */
export const emptyStates = {
  noSupplyRequests: {
    title: 'No Supply Requests',
    description: "You haven't made any supply requests yet. Request office supplies and materials.",
  },
  noKeyRequests: {
    title: 'No Key Requests',
    description: "You haven't requested any keys yet. Request access to rooms and facilities.",
  },
  noIssues: {
    title: 'No Issues Reported',
    description: "Everything looks good! Report an issue if you find something that needs attention.",
  },
  noNotifications: {
    title: 'No Notifications',
    description: "You're all caught up! New notifications will appear here.",
  },
  noResults: {
    title: 'No Results Found',
    description: "Try adjusting your search or filters to find what you're looking for.",
  },
  noData: {
    title: 'No Data Available',
    description: "There's nothing to display here yet.",
  },
};
