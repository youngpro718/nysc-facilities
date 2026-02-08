import React from "react";
import { logger } from '@/lib/logger';
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavigationTab, Tab } from "../types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useSupplyPendingCounts } from "@/hooks/useSupplyPendingCounts";
import { useStaffTasksPendingCounts } from "@/hooks/useStaffTasksPendingCounts";
import { Badge } from "@/components/ui/badge";
import { getNavigationPath } from "../utils/navigationPaths";

interface DesktopNavigationImprovedProps {
  navigation: NavigationTab[];
  onSignOut: () => void;
}

export const DesktopNavigationImproved = ({
  navigation,
  onSignOut
}: DesktopNavigationImprovedProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, user } = useAuth();
  const { data: adminNotifications = [] } = useAdminNotifications();
  const { data: supplyCounts } = useSupplyPendingCounts();
  const { data: staffTaskCounts } = useStaffTasksPendingCounts();
  // Real-time notifications are set up at app level via useConditionalNotifications
  // Use a simple "last seen" timestamp to compute new notifications
  const [lastSeenAt, setLastSeenAt] = React.useState<string>(() => {
    try { return localStorage.getItem('admin.notifications.lastSeen') || ''; } catch { return ''; }
  });
  const unreadCount = React.useMemo(() => {
    try {
      if (!isAdmin) return 0;
      const uid = user?.id;
      return (adminNotifications || []).filter((n) => {
        const readers: string[] = Array.isArray((n as { read_by?: string[] }).read_by) ? (n as { read_by?: string[] }).read_by! : [];
        return !uid || !readers.includes(uid);
      }).length;
    } catch {
      return 0;
    }
  }, [adminNotifications, isAdmin, user?.id]);
  

  const handleNavigation = (title: string) => {
    const path = getNavigationPath(title, isAdmin);
    if (path) {
      navigate(path);
    } else {
      logger.warn("DesktopNavigationImproved: Unmapped navigation title", title);
    }
  };

  // Get badge count for navigation items
  const getBadgeCount = (title: string): number => {
    // Tasks: show staff tasks counts (NOT supply orders)
    if (title === 'Tasks') {
      if (!staffTaskCounts) return 0;
      if (isAdmin) {
        return staffTaskCounts.pendingApproval;
      }
      return staffTaskCounts.availableToClaim;
    }
    
    // Supply Room: show supply orders to fulfill (for fulfillment staff)
    if (title === 'Supply Room') {
      return supplyCounts?.pendingOrders || 0;
    }
    
    // Supply Requests (Admin): show orders needing approval
    if (title === 'Supply Requests' && isAdmin) {
      return supplyCounts?.pendingApprovals || 0;
    }
    
    return 0;
  };

  return (
    <TooltipProvider>
      <nav className="hidden md:flex items-center gap-2">
        {navigation.map((item, index) => {
          if (item.type === "separator") {
            return (
              <div 
                key={`separator-${index}`} 
                className="mx-2 h-6 w-px bg-border" 
                aria-hidden="true" 
              />
            );
          }

          const navItem = item as Tab;
          const Icon = navItem.icon;
          const path = getNavigationPath(navItem.title, isAdmin);
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          const badgeCount = getBadgeCount(navItem.title);
          
          return (
            <Tooltip key={navItem.title}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNavigation(navItem.title)}
                  className={cn(
                    "group relative flex items-center gap-1 px-2 h-10 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  aria-label={navItem.title}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5" />
                  <span
                    className={cn(
                      "text-sm font-medium transition-all duration-200 overflow-hidden",
                      isActive
                        ? "max-w-[160px] opacity-100 ml-1"
                        : "max-w-0 opacity-0 ml-0 group-hover:max-w-[160px] group-hover:opacity-100 group-hover:ml-1 group-focus:max-w-[160px] group-focus:opacity-100 group-focus:ml-1"
                    )}
                  >
                    {navItem.title}
                  </span>
                  {badgeCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className={cn(
                        "absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 text-xs font-bold",
                        isActive && "bg-white text-primary"
                      )}
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Badge>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-sm">
                {navItem.title}
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {/* Notifications (Admins) - handled by NotificationBox in Layout header to avoid duplicate bells */}

        {/* Sign Out Button */}
        <div className="ml-2 pl-2 border-l border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onSignOut}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-sm">
              Sign out
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </TooltipProvider>
  );
};

