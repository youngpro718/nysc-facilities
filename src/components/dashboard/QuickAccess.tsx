import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  AlertCircle, 
  Bell,
  Building2, 
  Key, 
  Plus, 
  Settings, 
  User 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuickAccessProps {
  onReportIssue: () => void;
  unreadNotifications?: number;
}

export function QuickAccess({ onReportIssue, unreadNotifications = 0 }: QuickAccessProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const quickActions = [
    {
      label: "Report Issue",
      icon: <Plus className="h-4 w-4" />,
      onClick: onReportIssue,
      description: "Submit a new request",
      priority: "high",
      color: "bg-blue-500/10 text-blue-500"
    },
    {
      label: "My Issues",
      icon: <AlertCircle className="h-4 w-4" />,
      onClick: () => scrollToSection('reported-issues'),
      description: "View reported issues",
      priority: "medium",
      color: "bg-yellow-500/10 text-yellow-500"
    },
    {
      label: "My Rooms",
      icon: <Building2 className="h-4 w-4" />,
      onClick: () => scrollToSection('assigned-rooms'),
      description: "Room assignments",
      priority: "medium",
      color: "bg-green-500/10 text-green-500"
    },
    {
      label: "My Keys",
      icon: <Key className="h-4 w-4" />,
      onClick: () => scrollToSection('assigned-keys'),
      description: "Key assignments",
      priority: "medium",
      color: "bg-purple-500/10 text-purple-500"
    },
    {
      label: "Notifications",
      icon: <Bell className="h-4 w-4" />,
      onClick: () => scrollToSection('notifications'),
      description: unreadNotifications > 0 ? `${unreadNotifications} unread` : "All notifications",
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
      priority: unreadNotifications > 0 ? "high" : "medium",
      color: "bg-orange-500/10 text-orange-500"
    },
    {
      label: "Profile",
      icon: <User className="h-4 w-4" />,
      onClick: () => navigate("/profile"),
      description: "Account settings",
      priority: "low",
      color: "bg-gray-500/10 text-gray-500"
    }
  ].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Card className={cn(
      "p-4",
      "animate-in fade-in-50 slide-in-from-bottom-5",
      "border-none shadow-none bg-transparent"
    )}>
      {isMobile ? (
        <ScrollArea className="pb-2 -mx-2 px-2">
          <div className="flex gap-2 min-w-max">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className={cn(
                  "flex-col items-center justify-center gap-2",
                  "h-auto py-3 px-4",
                  "transition-all duration-200 ease-in-out",
                  "relative",
                  action.color
                )}
                onClick={action.onClick}
              >
                <div className="rounded-full p-2">
                  {action.icon}
                </div>
                <div className="text-center">
                  <div className="font-medium text-xs whitespace-nowrap">
                    {action.label}
                  </div>
                </div>
                {action.badge && (
                  <div className={cn(
                    "absolute -top-1 -right-1",
                    "bg-primary text-primary-foreground",
                    "rounded-full w-4 h-4",
                    "flex items-center justify-center",
                    "text-[10px] font-medium",
                    "animate-pulse"
                  )}>
                    {action.badge}
                  </div>
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className={cn(
          "grid gap-2",
          "grid-cols-3 md:grid-cols-6"
        )}>
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className={cn(
                "h-auto flex-col items-center justify-center gap-1.5",
                "p-3 hover:bg-accent relative",
                "transition-all duration-200 ease-in-out",
                "group"
              )}
              onClick={action.onClick}
            >
              <div className={cn(
                "rounded-full bg-background p-2",
                "transition-colors group-hover:bg-accent"
              )}>
                {action.icon}
              </div>
              <div className="text-center">
                <div className="font-medium text-xs">
                  {action.label}
                </div>
                <p className={cn(
                  "text-[10px]",
                  "text-muted-foreground",
                  "line-clamp-1"
                )}>
                  {action.description}
                </p>
              </div>
              {action.badge && (
                <div className={cn(
                  "absolute top-1 right-1",
                  "bg-primary text-primary-foreground",
                  "rounded-full w-3.5 h-3.5",
                  "flex items-center justify-center",
                  "text-[9px] font-medium",
                  "animate-pulse"
                )}>
                  {action.badge}
                </div>
              )}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}
