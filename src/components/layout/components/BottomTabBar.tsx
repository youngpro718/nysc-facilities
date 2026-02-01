import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NavigationTab } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { MoreHorizontal } from "lucide-react";
import { useSupplyPendingCounts } from "@/hooks/useSupplyPendingCounts";
import { useStaffTasksPendingCounts } from "@/hooks/useStaffTasksPendingCounts";
import { Badge } from "@/components/ui/badge";

interface BottomTabBarProps {
  navigation: NavigationTab[];
  onOpenMobileMenu: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ navigation, onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: supplyCounts } = useSupplyPendingCounts();
  const { data: staffTaskCounts } = useStaffTasksPendingCounts();

  const items = navigation.filter((i) => (i as any).title) as Array<{ title: string; icon: any }>;
  const primary = items.slice(0, 4);
  const hasMore = items.length > 4;

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

  const handleNav = (title: string) => {
    const path = getNavigationPath(title, isAdmin);
    if (path) navigate(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 md:hidden safe-area-bottom"
      role="navigation"
      aria-label="Mobile primary navigation"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
      }}
    >
      <div className="mx-auto max-w-7xl px-1 xs:px-2">
        <div className={cn("grid", hasMore ? "grid-cols-5" : "grid-cols-4")}>
          {primary.map((item) => {
            const Icon = item.icon;
            const path = getNavigationPath(item.title, isAdmin);
            const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
            const badgeCount = getBadgeCount(item.title);
            
            return (
              <button
                key={item.title}
                onClick={() => handleNav(item.title)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 xs:gap-1 py-2 min-h-[56px] touch-target touch-manipulation",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  "active:scale-95 transition-transform duration-100",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.title}
              >
                <div className={cn(
                  "relative p-1 rounded-lg transition-colors",
                  isActive && "bg-primary/10"
                )}>
                  <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} aria-hidden="true" />
                  {badgeCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-2 h-4 min-w-[16px] px-1 text-[10px] font-bold"
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] xs:text-[11px] leading-none font-medium truncate max-w-full",
                  isActive && "font-semibold"
                )}>
                  {item.title}
                </span>
              </button>
            );
          })}

          {hasMore && (
            <button
              onClick={onOpenMobileMenu}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 xs:gap-1 py-2 min-h-[56px] touch-target touch-manipulation",
                "text-muted-foreground hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "active:scale-95 transition-transform duration-100"
              )}
              aria-label="More options"
            >
              <div className="p-1">
                <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-[10px] xs:text-[11px] leading-none font-medium">More</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

function getNavigationPath(title: string, isAdmin?: boolean): string {
  const pathMap: Record<string, string> = {
    Dashboard: isAdmin ? "/" : "/dashboard",
    "New Request": "/request",
    Spaces: "/spaces",
    Operations: "/operations",
    Issues: "/operations?tab=issues",
    "Access & Assignments": "/access-assignments",
    Occupants: "/occupants",
    Inventory: "/inventory",
    "Supply Requests": "/admin/supply-requests",
    "Supply Room": "/supply-room",
    "Supplies": "/tasks",
    "Tasks": "/tasks",
    Keys: "/keys",
    Lighting: "/lighting",
    Maintenance: "/operations?tab=maintenance",
    "Court Operations": "/court-operations",
    "My Activity": "/my-activity",
    "My Requests": "/my-activity?tab=keys",
    "My Issues": "/my-activity?tab=issues",
    "Admin Center": "/admin",
    "Admin Profile": "/admin", // Legacy fallback
    Profile: "/profile",
    "System Settings": "/system-settings",
  };
  return pathMap[title] || "/";
}
