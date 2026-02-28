// Layout component — app shell with sidebar navigation, header, and floating controls
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { getRoleBasedNavigation, getNavigationRoutes } from "./config/navigation";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { MobileMenu } from "./components/MobileMenu";
import { BottomTabBar } from "./components/BottomTabBar";
import { AppSidebar } from "./components/AppSidebar";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBox } from "@/components/admin/NotificationBox";
import { RefreshCw, Search } from "lucide-react";
import { GlobalSearchPalette } from "./components/GlobalSearchPalette";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Button } from "@/components/ui/button";
import { NavigationSkeleton, MobileNavigationSkeleton } from "./NavigationSkeleton";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { DevModeBanner } from "@/components/dev/DevModeBanner";
import { TourProvider } from "@/components/help/TourProvider";
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
  const { permissions, userRole, profile, loading: permissionsLoading, refetch } = useRolePermissions();
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

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
  const isPreviewActive = isAdmin && previewRole && previewRole !== 'admin';

  // Get sidebar state for margin offset
  let sidebarState: "expanded" | "collapsed" = "expanded";
  try {
    const ctx = useSidebar();
    sidebarState = ctx.state;
  } catch {
    // Outside SidebarProvider (login page) — default to expanded
  }

  // Derive page title from current path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    const segment = path.split('/').filter(Boolean)[0] || '';
    return segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Global Search Palette (⌘K) */}
      {isAdmin && <GlobalSearchPalette open={searchOpen} onOpenChange={setSearchOpen} />}

      {/* Dev Mode Preview Banner */}
      {!isLoginPage && isAuthenticated && isPreviewActive && (
        <DevModeBanner realRole="admin" previewRole={previewRole!} />
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
          <header className="bg-surface sticky top-0 z-30 border-b border-border h-14">
            <div className="flex items-center h-full px-4 lg:px-8">
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
              <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">
                {getPageTitle()}
              </h1>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Right utilities */}
              <div className="flex items-center gap-2 shrink-0">
                {isAdmin && (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center gap-1.5 h-8 px-2 rounded-md border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">Search…</span>
                    <kbd className="pointer-events-none hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </button>
                )}

                {isAdmin && (
                  <div data-tour="notification-box">
                    <NotificationBox />
                  </div>
                )}

                <div data-tour="theme-toggle">
                  <ThemeToggle />
                </div>

                {/* Profile Avatar */}
                <button
                  className="hidden md:block focus:outline-none p-0.5 rounded-full hover:bg-muted/50 transition-colors shrink-0"
                  title="Profile"
                  data-tour="user-avatar"
                  onClick={() => navigate('/profile')}
                >
                  <UserAvatar
                    src={(profile as any)?.avatar_url as string | undefined}
                    firstName={(profile as any)?.first_name as string | undefined}
                    lastName={(profile as any)?.last_name as string | undefined}
                    className="h-8 w-8"
                    showFallbackIcon
                  />
                </button>

                {/* Profile Avatar — mobile only */}
                <button
                  className="md:hidden focus:outline-none p-0.5 rounded-full hover:bg-muted/50 transition-colors shrink-0"
                  title="Profile"
                  onClick={() => navigate('/profile')}
                >
                  <UserAvatar
                    src={(profile as any)?.avatar_url as string | undefined}
                    firstName={(profile as any)?.first_name as string | undefined}
                    lastName={(profile as any)?.last_name as string | undefined}
                    className="h-8 w-8"
                    showFallbackIcon
                  />
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Global Onboarding Wizard */}
        {isAuthenticated && !isLoginPage && showOnboarding && (
          <OnboardingWizard onComplete={completeOnboarding} onSkip={skipOnboarding} />
        )}

        <main className="flex-1 pb-24 md:pb-0 safe-area-bottom">
          <div className="mx-auto max-w-none xl:max-w-[95%] 2xl:max-w-[90%] px-3 sm:px-4 lg:px-8 xl:px-12 py-4 sm:py-8 xl:py-12">
            <Outlet />
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
      </div>
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
