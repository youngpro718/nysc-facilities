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

interface QuickAccessProps {
  onReportIssue: () => void;
  unreadNotifications?: number;
}

export function QuickAccess({ onReportIssue, unreadNotifications = 0 }: QuickAccessProps) {
  const navigate = useNavigate();

  const quickActions = [
    {
      label: "Report Issue",
      icon: <Plus className="h-4 w-4" />,
      onClick: onReportIssue,
      description: "Submit a new request"
    },
    {
      label: "My Issues",
      icon: <AlertCircle className="h-4 w-4" />,
      onClick: () => document.getElementById('reported-issues')?.scrollIntoView({ behavior: 'smooth' }),
      description: "View reported issues"
    },
    {
      label: "My Rooms",
      icon: <Building2 className="h-4 w-4" />,
      onClick: () => document.getElementById('assigned-rooms')?.scrollIntoView({ behavior: 'smooth' }),
      description: "Room assignments"
    },
    {
      label: "My Keys",
      icon: <Key className="h-4 w-4" />,
      onClick: () => document.getElementById('assigned-keys')?.scrollIntoView({ behavior: 'smooth' }),
      description: "Key assignments"
    },
    {
      label: "Notifications",
      icon: <Bell className="h-4 w-4" />,
      onClick: () => document.getElementById('notifications')?.scrollIntoView({ behavior: 'smooth' }),
      description: unreadNotifications > 0 ? `${unreadNotifications} unread` : "All notifications",
      badge: unreadNotifications > 0 ? unreadNotifications : undefined
    },
    {
      label: "Profile",
      icon: <User className="h-4 w-4" />,
      onClick: () => navigate("/profile"),
      description: "Account settings"
    }
  ];

  return (
    <Card className="p-4" id="quick-access">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Quick Access</h2>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto flex-col items-center justify-center gap-1.5 p-2 hover:bg-accent relative"
            onClick={action.onClick}
          >
            <div className="rounded-full bg-background p-1.5">
              {action.icon}
            </div>
            <div className="text-center">
              <div className="font-medium text-xs">{action.label}</div>
              <p className="text-[10px] text-muted-foreground">
                {action.description}
              </p>
            </div>
            {action.badge && (
              <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-medium">
                {action.badge}
              </div>
            )}
          </Button>
        ))}
      </div>
    </Card>
  );
} 