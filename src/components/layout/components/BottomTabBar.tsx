import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NavigationTab } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { MoreHorizontal } from "lucide-react";

interface BottomTabBarProps {
  navigation: NavigationTab[];
  onOpenMobileMenu: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ navigation, onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const items = navigation.filter((i) => (i as any).title) as Array<{ title: string; icon: any }>;
  const primary = items.slice(0, 4);
  const hasMore = items.length > 4;

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
      <div className="mx-auto max-w-7xl px-2">
        <div className={cn("grid", hasMore ? "grid-cols-5" : "grid-cols-4")}>
          {primary.map((item) => {
            const Icon = item.icon;
            const path = getNavigationPath(item.title, isAdmin);
            const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
            return (
              <button
                key={item.title}
                onClick={() => handleNav(item.title)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 min-h-[58px] touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-[11px] leading-none font-medium">{item.title}</span>
              </button>
            );
          })}

          {hasMore && (
            <button
              onClick={onOpenMobileMenu}
              className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-[58px] touch-target text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="More"
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
              <span className="text-[11px] leading-none font-medium">More</span>
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
    "My Requests": "/my-activity?tab=keys", // Legacy - redirect to activity
    "My Issues": "/my-activity?tab=issues", // Legacy - redirect to activity
    "Admin Profile": "/admin-profile",
    Profile: "/profile",
  };
  return pathMap[title] || "/";
}
