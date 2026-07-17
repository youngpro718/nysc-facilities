// Layout component — app shell with sidebar navigation, header, and floating controls
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getRouteConfig } from "@/config/routes";
import { Breadcrumb } from "./Breadcrumb";
import { PageTransition } from "./PageTransition";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@features/auth/hooks/useAuth";
import { logger } from "@/lib/logger";
import { getRoleBasedNavigation, getNavigationRoutes } from "./config/navigation";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";
import { MobileMenu } from "./components/MobileMenu";
import { BottomTabBar } from "./components/BottomTabBar";
import { AppSidebar } from "./components/AppSidebar";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBox } from "@features/admin/components/admin/NotificationBox";
import { RefreshCw, Search, Package, AlertTriangle, ClipboardList, KeyRound, Lightbulb, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuickIssueReportButton } from "@shared/components/user/QuickIssueReportButton";
import { GlobalSearchPalette } from "./components/GlobalSearchPalette";
import { Button } from "@/components/ui/button";
import { NavigationSkeleton, MobileNavigationSkeleton } from "./NavigationSkeleton";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { DevModeBanner } from "@shared/components/dev/DevModeBanner";
import { SupportChatWidget } from "@shared/components/support/SupportChatWidget";
import { APP_INFO, APP_COPYRIGHT } from "@/lib/appInfo";
import { WhatsNewDialog } from "@shared/components/help/WhatsNewDialog";
import { TourProvider } from "@shared/components/help/TourProvider";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import type { UserRole } from "@/config/roles";

function LayoutContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);

  // Global ⌘K / Ctrl+K shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  const { isAuthenticated, isAdmin, isLoading, signOut, user } = useAuth();
  const { permissions, userRole, profile, loading: permissionsLoading, permissionError, refetch } = useRolePermissions();

  const navReady = !!userRole && !permissionsLoading;
  const navigation = navReady
    ? getRoleBasedNavigation(permissions, userRole, profile)
    : [];

  useEffect(() => {
    if (!navReady && isAuthenticated && !isLoginPage) {
      const timer = setTimeout(() => {
        logger.warn('[Layout] Navigation stuck loading for 5s, showing refresh button');
        setShowRefreshButton(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowRefreshButton(false);
    }
  }, [navReady, isAuthenticated, isLoginPage]);

  const handleNavigationChange = (index: number | null) => {
    if (index === null) return;
    if (!navReady) return;
    const routes = getNavigationRoutes(permissions, userRole!, profile);
    const route = routes[index];
    if (route) {
      navigate(route);
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    if (user?.id && user.id !== lastUserId) {
      setLastUserId(user.id);
      if (lastUserId !== null) {
        logger.debug('[Layout] User changed - resetting navigation');
      }
    }
  }, [user?.id, lastUserId]);

  const previewRole = typeof window !== 'undefined' ? localStorage.getItem('preview_role') as UserRole | null : null;
  const isPreviewActive = isAdmin && previewRole && previewRole !== 'admin' && previewRole !== 'system_admin';

  // Get sidebar state for margin offset
  let sidebarState: "expanded" | "collapsed" = "expanded";
  try {
    const ctx = useSidebar();
    sidebarState = ctx.state;
  } catch {
    // Outside SidebarProvider (login page) — default to expanded
  }

  // Derive page title from route config, falling back to path-based generation
  const getPageTitle = () => {
    const path = location.pathname;
    const routeConfig = getRouteConfig(path);
    if (routeConfig?.title) return routeConfig.title;
    // Fallback: generate from path segments
    if (path === '/') return 'Dashboard';
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || '';
    return lastSegment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      {/* Global Search Palette (⌘K) */}
      {isAdmin && <GlobalSearchPalette open={searchOpen} onOpenChange={setSearchOpen} />}

      {/* Dev Mode Preview Banner */}
      {!isLoginPage && isAuthenticated && isPreviewActive && (
        <DevModeBanner realRole="system_admin" previewRole={previewRole!} />
      )}

      {/* Permission Error Banner */}
      {!isLoginPage && isAuthenticated && permissionError && (
        <div className="bg-destructive text-destructive-foreground px-4 py-3 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <span>{permissionError}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="ml-2 h-7 text-xs"
            >
              Reload Page
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar — desktop only, hidden on login */}
      {!isLoginPage && isAuthenticated && <AppSidebar />}

      {/* Main content area offset by sidebar width */}
      <div
        className={cn(
          "transition-all duration-200 ease-linear",
          !isLoginPage && isAuthenticated
            ? sidebarState === "collapsed"
              ? "md:ml-16"
              : "md:ml-[220px]"
            : ""
        )}
      >
        {/* Top header bar — slim, page title + utilities */}
        {!isLoginPage && isAuthenticated && (
          <header className="sticky top-0 z-30 border-b border-[#294263] bg-[#102848] text-white safe-area-top dark:border-white/[0.09] dark:bg-[#090909]">
            <div className="flex items-center h-11 sm:h-14 px-2 sm:px-4 lg:px-8">
              {/* Sidebar trigger for mobile */}
              <div className="md:hidden mr-2">
                {navReady ? (
                  <MobileMenu
                    isOpen={isMobileMenuOpen}
                    onOpenChange={setIsMobileMenuOpen}
                    navigation={navigation}
                    onNavigationChange={handleNavigationChange}
                    onSignOut={signOut}
                  />
                ) : showRefreshButton ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      refetch();
                      setShowRefreshButton(false);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                ) : (
                  <MobileNavigationSkeleton />
                )}
              </div>

              {/* Page title */}
              <h1 className="text-sm sm:text-base font-semibold tracking-tight text-white truncate">
                {getPageTitle()}
              </h1>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Right utilities */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Report Issue — for roles WITHOUT the richer Operations/Issues
                    page reporting. Admin & facilities_manager report through the
                    Issues page on desktop and the FAB on mobile, so the header
                    button (the simple wizard) would be a redundant second flow. */}
                {!isAdmin && userRole !== 'facilities_manager' && (
                  <QuickIssueReportButton
                    variant="outline"
                    size="sm"
                    className="h-8 border-white/15 bg-white/[0.04] px-2 text-white hover:bg-white/[0.1] hover:text-white"
                  >
                    <AlertTriangle className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Report Issue</span>
                  </QuickIssueReportButton>
                )}

                {/* Single "+ New" entry point in the header — keeps the bar
                    uncluttered as more request types come online. Court aides
                    fulfill orders, so they don't need the menu. */}
                {userRole !== 'court_aide' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 border-white/15 bg-white/[0.04] px-2.5 text-white hover:bg-white/[0.1] hover:text-white"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">New</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Start something new</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/supplies?tab=order')}>
                        <Package className="mr-2 h-4 w-4" />
                        Order Supplies
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/supplies?tab=request')}>
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Make a Request
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/keys/request')}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Request a Key
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/lighting/report')}>
                        <Lightbulb className="mr-2 h-4 w-4" />
                        Report Lighting
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {isAdmin && (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] text-xs text-white/70 transition-colors hover:bg-white/[0.1] hover:text-white sm:w-auto sm:px-2"
                  >
                    <Search className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden lg:inline">Search…</span>
                    <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded-sm border border-white/15 bg-white/[0.06] px-1.5 font-mono text-[10px] font-medium text-white/60 lg:inline-flex">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </button>
                )}

                {isAdmin && (
                  <div data-tour="notification-box" className="[&_button]:text-white [&_button:hover]:bg-white/[0.1]">
                    <NotificationBox />
                  </div>
                )}

                <div data-tour="theme-toggle" className="hidden sm:block [&_button]:text-white [&_button:hover]:bg-white/[0.1]">
                  <ThemeToggle />
                </div>

                {/* Profile Avatar — all roles (needed for My Room / self-service) */}
                {(
                  <button
                    className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-white/[0.1] focus:outline-none"
                    title="Profile"
                    aria-label="Open profile"
                    data-tour="user-avatar"
                    onClick={() => navigate('/profile')}
                  >
                    <UserAvatar
                      src={(profile as any)?.avatar_url as string | undefined}
                      firstName={(profile as any)?.first_name as string | undefined}
                      lastName={(profile as any)?.last_name as string | undefined}
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      showFallbackIcon
                    />
                  </button>
                )}
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 pb-40 md:pb-0 safe-area-bottom mobile-main-padding">
          <div className="mx-auto w-full max-w-[1600px] px-3 py-3 sm:px-5 sm:py-6 lg:px-8">
            <Breadcrumb className="mb-2" />
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile bottom tab bar */}
        {isAuthenticated && !isLoginPage && navReady && (
          <BottomTabBar
            navigation={navigation}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        )}

        {/* Floating Action Button for quick actions */}
        {isAuthenticated && !isLoginPage && <FloatingActionButton />}

        {/* App footer — credit + version */}
        {isAuthenticated && !isLoginPage && (
          <footer className="hidden md:block border-t border-border/50 py-3 px-8">
            <p className="text-[11px] text-muted-foreground text-center">
              {APP_INFO.name}{" "}
              <button
                type="button"
                onClick={() => setWhatsNewOpen(true)}
                className="hover:text-foreground transition-colors underline-offset-2 hover:underline"
                title="See what's new in this version"
              >
                v{APP_INFO.version}
              </button>
              {" "}&nbsp;·&nbsp; {APP_COPYRIGHT} &nbsp;·&nbsp;
              <a href={APP_INFO.support.emailHref} className="hover:text-foreground transition-colors underline-offset-2 hover:underline">
                {APP_INFO.support.email}
              </a>
            </p>
          </footer>
        )}

        <WhatsNewDialog open={whatsNewOpen} onOpenChange={setWhatsNewOpen} />
      </div>

      {/* AI Support Chat — visible when authenticated and not on login */}
      {isAuthenticated && !isLoginPage && <SupportChatWidget />}
    </div>
  );
}

const Layout = () => {
  return (
    <TourProvider>
      <SidebarProvider>
        <LayoutContent />
      </SidebarProvider>
    </TourProvider>
  );
};

export default Layout;
