import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { getRoleBasedNavigation, getNavigationRoutes } from "@/components/layout/config/navigation";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ChevronLeft, LogOut, HelpCircle, LifeBuoy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { NavigationTab } from "@/components/layout/types";

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { permissions, userRole, profile } = useRolePermissions();

  const navReady = !!userRole;
  const navigation = navReady
    ? getRoleBasedNavigation(permissions, userRole, profile)
    : [];
  const routes = navReady
    ? getNavigationRoutes(permissions, userRole!, profile)
    : [];

  const firstName = (profile as any)?.first_name || "";
  const lastName = (profile as any)?.last_name || "";
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "User";
  const roleLabel = userRole
    ? userRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  const isActive = (route: string) => {
    if (!route) return false;
    if (route === "/") return location.pathname === "/";
    return location.pathname.startsWith(route);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 left-0 z-40 border-r border-sidebar-border bg-sidebar transition-all duration-200 ease-linear",
          collapsed ? "w-16" : "w-[220px]"
        )}
      >
        {/* Header: Logo + collapse toggle */}
        <div className={cn("flex items-center h-14 px-3 border-b border-sidebar-border", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative h-8 w-8 shrink-0">
                <img src="/nysc-logo-light.png" alt="NYSC" className="h-full w-full object-contain dark:hidden" />
                <img src="/nysc-logo-dark.png" alt="NYSC" className="h-full w-full object-contain hidden dark:block" />
              </div>
              <span className="text-sm font-semibold truncate text-sidebar-foreground">NYSC Facilities</span>
            </div>
          )}
          {collapsed && (
            <div className="relative h-8 w-8 shrink-0">
              <img src="/nysc-logo-light.png" alt="NYSC" className="h-full w-full object-contain dark:hidden" />
              <img src="/nysc-logo-dark.png" alt="NYSC" className="h-full w-full object-contain hidden dark:block" />
            </div>
          )}
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navigation.map((item: NavigationTab, index: number) => {
            if ("type" in item && item.type === "separator") {
              return (
                <div key={`sep-${index}`} className="my-2 mx-2 border-t border-border-subtle" />
              );
            }

            const tab = item as { title: string; icon: any };
            const route = routes[index] || "";
            const active = isActive(route);
            const Icon = tab.icon;

            if (collapsed) {
              return (
                <Tooltip key={tab.title}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => route && navigate(route)}
                      className={cn(
                        "flex items-center justify-center w-full h-10 rounded-lg transition-colors",
                        active
                          ? "bg-color-accent/10 text-color-accent"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {tab.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <button
                key={tab.title}
                onClick={() => route && navigate(route)}
                className={cn(
                  "flex items-center gap-2.5 w-full h-10 px-3 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-color-accent/10 text-foreground border-l-2 border-l-color-accent"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-color-accent")} />
                <span className="truncate">{tab.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer: Help + User info + Sign out */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {/* Help link */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate("/help")}
                  className="flex items-center justify-center w-full h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <LifeBuoy className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>Help &amp; Guides</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => navigate("/help")}
              className="flex items-center gap-2.5 w-full h-9 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <LifeBuoy className="h-[18px] w-[18px] shrink-0" />
              <span>Help &amp; Guides</span>
            </button>
          )}

          {/* User info */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center justify-center w-full h-10 rounded-lg hover:bg-accent transition-colors"
                >
                  <UserAvatar
                    src={(profile as any)?.avatar_url}
                    firstName={firstName}
                    lastName={lastName}
                    className="h-8 w-8"
                    showFallbackIcon
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p>{displayName}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-1.5">
              <UserAvatar
                src={(profile as any)?.avatar_url}
                firstName={firstName}
                lastName={lastName}
                className="h-8 w-8 shrink-0"
                showFallbackIcon
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium truncate text-sidebar-foreground">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{roleLabel}</p>
              </div>
            </div>
          )}

          {/* Sign out */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut()}
                  className="flex items-center justify-center w-full h-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2.5 w-full h-9 px-3 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="px-2 pb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center w-full h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Expand sidebar"
                >
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>Expand sidebar</TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
