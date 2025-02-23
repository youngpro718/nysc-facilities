
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const quickActions = [
    {
      label: "Report Issue",
      icon: <Plus className="h-3.5 w-3.5" />,
      onClick: onReportIssue,
      description: "Submit a new request"
    },
    {
      label: "My Issues",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      onClick: () => scrollToSection('reported-issues'),
      description: "View reported issues"
    },
    {
      label: "My Rooms",
      icon: <Building2 className="h-3.5 w-3.5" />,
      onClick: () => scrollToSection('assigned-rooms'),
      description: "Room assignments"
    },
    {
      label: "My Keys",
      icon: <Key className="h-3.5 w-3.5" />,
      onClick: () => scrollToSection('assigned-keys'),
      description: "Key assignments"
    },
    {
      label: "Notifications",
      icon: <Bell className="h-3.5 w-3.5" />,
      onClick: () => scrollToSection('notifications'),
      description: unreadNotifications > 0 ? `${unreadNotifications} unread` : "All notifications",
      badge: unreadNotifications > 0 ? unreadNotifications : undefined
    },
    {
      label: "Profile",
      icon: <User className="h-3.5 w-3.5" />,
      onClick: () => navigate("/profile"),
      description: "Account settings"
    }
  ];

  return (
    <Card className="p-3" id="quick-access">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Quick Access</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto flex-col items-center justify-center gap-1 p-1.5 hover:bg-accent relative"
            onClick={action.onClick}
          >
            <div className="rounded-full bg-background p-1">
              {action.icon}
            </div>
            <div className="text-center">
              <div className="font-medium text-[11px]">{action.label}</div>
              <p className="text-[9px] text-muted-foreground">
                {action.description}
              </p>
            </div>
            {action.badge && (
              <div className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] font-medium">
                {action.badge}
              </div>
            )}
          </Button>
        ))}
      </div>
    </Card>
  );
}
