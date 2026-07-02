import { NavLink, useLocation } from "react-router-dom";
import { useKeyRequestsPendingCount } from "@features/keys/hooks/useKeyRequestsPendingCount";
import { useLightingIssuesPendingCount } from "@features/lighting/hooks/useLightingIssuesPendingCount";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";
import { getRoleBasedNavigation, getNavigationRoutes } from "@/components/layout/config/navigation";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ChevronLeft, LogOut, LifeBuoy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { prefetchRoute } from "@/lib/prefetchRoutes";
import { isNavRouteActive } from "@/components/layout/utils/navigationPaths";
import type { NavigationTab } from "@/components/layout/types";

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
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

  const isActive = (route: string) =>
    isNavRouteActive(route, location.pathname, location.search);

  // Pending key-request count — RLS scopes to what this user can see, so this
  // is the Facility Coordinator queue for FM/admin and ~0 for everyone else.
  const { data: pendingKeyRequests = 0 } = useKeyRequestsPendingCount();
  const { data: openLightingIssues = 0 } = useLightingIssuesPendingCount();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 left-0 z-40 border-r border-sidebar-border bg-sidebar transition-all duration-200 ease-linear",
          collapsed ? "w-16" : "w-[220px]"
        )}
      >
        {/* Header: Logo + collapse toggle */}
        <div className={cn("flex items-center h-16 px-3 border-b border-sidebar-border", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative h-14 w-14 shrink-0">
                <img src="/nysc-logo-dark.webp" alt="NYSC" className="h-full w-full object-contain" />
              </div>
              <span className="text-sm font-semibold truncate text-sidebar-foreground">NYSC Facilities</span>
            </div>
          )}
          {collapsed && (
            <div className="relative h-12 w-12 shrink-0">
              <img src="/nysc-logo-dark.png" alt="NYSC" className="h-full w-full object-contain" />
            </div>
          )}
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
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

            const showKeysBadge = tab.title === 'Keys' && pendingKeyRequests > 0;
            const showOpsBadge = tab.title === 'Operations' && openLightingIssues > 0;
            const showBadge = showKeysBadge || showOpsBadge;
            const badgeCount = showKeysBadge ? pendingKeyRequests : openLightingIssues;

            if (collapsed) {
              return (
                <Tooltip key={tab.title}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={route}
                      onPointerEnter={() => prefetchRoute(route)}
                      onFocus={() => prefetchRoute(route)}
                      aria-label={
                        showBadge
                          ? `${tab.title} — ${badgeCount} pending`
                          : tab.title
                      }
                      className={cn(
                        "relative flex h-10 w-full items-center justify-center rounded-md transition-colors",
                        active
                          ? "bg-white/[0.12] text-white shadow-[inset_2px_0_0_hsl(var(--brand-gold))]"
                          : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {showBadge && (
                        <span className="absolute top-1 right-1 inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                      )}
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {showBadge
                      ? `${tab.title} — ${badgeCount} pending`
                      : tab.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <NavLink
                key={tab.title}
                to={route}
                onPointerEnter={() => prefetchRoute(route)}
                onFocus={() => prefetchRoute(route)}
                className={cn(
                  "flex h-10 w-full items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors",
                  active
                    ? "border-l-2 border-l-[hsl(var(--brand-gold))] bg-white/[0.12] text-white"
                    : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-white")} />
                <span className="truncate">{tab.title}</span>
                {showBadge && (
                  <span className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400/20 px-1.5 py-0.5 text-xs font-semibold text-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/40">
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer: Help + User info + Sign out */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {/* Help link */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/help"
                  className="flex h-9 w-full items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  <LifeBuoy className="h-[18px] w-[18px]" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>Help &amp; Guides</TooltipContent>
            </Tooltip>
          ) : (
            <NavLink
              to="/help"
              className="flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-sm text-slate-300 transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              <LifeBuoy className="h-[18px] w-[18px] shrink-0" />
              <span>Help &amp; Guides</span>
            </NavLink>
          )}

          {/* User info */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/profile"
                  className="flex h-10 w-full items-center justify-center rounded-md transition-colors hover:bg-white/[0.07]"
                >
                  <UserAvatar
                    src={(profile as any)?.avatar_url}
                    firstName={firstName}
                    lastName={lastName}
                    className="h-8 w-8"
                    showFallbackIcon
                  />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p>{displayName}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <NavLink to="/profile" className="flex items-center gap-2.5 rounded-md px-3 py-1.5 hover:bg-white/[0.07]">
              <UserAvatar
                src={(profile as any)?.avatar_url}
                firstName={firstName}
                lastName={lastName}
                className="h-8 w-8 shrink-0"
                showFallbackIcon
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium truncate text-sidebar-foreground">{displayName}</p>
                <p className="truncate text-[11px] text-slate-400">{roleLabel}</p>
              </div>
            </NavLink>
          )}

          {/* Sign out */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut()}
                  className="flex h-9 w-full items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => signOut()}
              className="flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-sm text-slate-300 transition-colors hover:bg-white/[0.07] hover:text-white"
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
                  className="flex h-8 w-full items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/[0.07] hover:text-white"
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
