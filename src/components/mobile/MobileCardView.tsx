import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadge {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}

interface QuickAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

interface MobileCardViewProps {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  status?: StatusBadge;
  badges?: StatusBadge[];
  quickActions?: QuickAction[];
  onCardClick?: () => void;
  onMenuClick?: () => void;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function MobileCardView({
  title,
  subtitle,
  description,
  image,
  status,
  badges = [],
  quickActions = [],
  onCardClick,
  onMenuClick,
  children,
  className,
  compact = false
}: MobileCardViewProps) {
  const cardContent = (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex gap-3">
          {/* Image/Avatar */}
          {image && (
            <div className="shrink-0">
              <img 
                src={image} 
                alt={title}
                className={cn(
                  "object-cover rounded-lg border",
                  compact ? "w-12 h-12" : "w-16 h-16"
                )}
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {/* Header with title and menu */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 mr-2">
                <h3 className={cn(
                  "font-medium leading-tight truncate",
                  compact ? "text-sm" : "text-base"
                )}>
                  {title}
                </h3>
                {subtitle && (
                  <p className={cn(
                    "text-muted-foreground truncate",
                    compact ? "text-xs" : "text-sm"
                  )}>
                    {subtitle}
                  </p>
                )}
              </div>
              
              {onMenuClick && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenuClick();
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Status and Badges */}
            {(status || badges.length > 0) && (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {status && (
                  <Badge 
                    variant={status.variant}
                    className={compact ? "text-xs" : "text-xs"}
                  >
                    {status.label}
                  </Badge>
                )}
                {badges.map((badge, index) => (
                  <Badge 
                    key={index}
                    variant={badge.variant}
                    className={compact ? "text-xs" : "text-xs"}
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            {description && (
              <p className={cn(
                "text-muted-foreground mb-3 line-clamp-2",
                compact ? "text-xs" : "text-sm"
              )}>
                {description}
              </p>
            )}

            {/* Custom children content */}
            {children && (
              <div className="mb-3">
                {children}
              </div>
            )}

            {/* Quick Actions */}
            {quickActions.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || "outline"}
                    size="sm"
                    className={cn(
                      "h-8 gap-1",
                      compact && "h-7 text-xs px-2"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                  >
                    {action.icon}
                    <span className="hidden sm:inline">{action.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (onCardClick) {
    return (
      <button 
        className="w-full text-left"
        onClick={onCardClick}
      >
        {cardContent}
      </button>
    );
  }

  return cardContent;
}