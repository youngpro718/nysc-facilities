// Layout component — app shell with navigation, header, and floating controls
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { getRoleBasedNavigation, getNavigationRoutes } from "./config/navigation";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { MobileMenu } from "./components/MobileMenu";
import { BottomTabBar } from "./components/BottomTabBar";
import { DesktopNavigationImproved } from "./components/DesktopNavigationImproved";
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
import { HelpButton } from "@/components/help/HelpButton";
import type { UserRole } from "@/config/roles";

const Layout = () => {
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

  // OPTIMIZATION: Build navigation even while loading to enable progressive rendering
  // Use userRole if available, or show skeleton instead of blocking
  const navReady = !!userRole && !permissionsLoading;
  const navigation = navReady 
    ? getRoleBasedNavigation(permissions, userRole, profile) 
    : [];
  
  // Show partial UI faster - don't wait for full permissions
  const canShowPartialUI = isAuthenticated && !isLoading;

  // OPTIMIZATION: Reduced timeout from 8s to 5s since we now load faster
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

    // If userRole not ready yet, use a safe default (standard user routes)
    if (!navReady) return; // avoid routing until nav is ready
    const routes = getNavigationRoutes(permissions, userRole!, profile);

    const route = routes[index];
    if (route) {
      navigate(route);
      setIsMobileMenuOpen(false);
    }
  };

  // Reset navigation when user changes (fixes stale navigation on account switch)
  useEffect(() => {
    if (user?.id && user.id !== lastUserId) {
      setLastUserId(user.id);
      // Force navigation to refresh by invalidating any cached state
      if (lastUserId !== null) {
        // This is an account switch, not initial load
        logger.debug('[Layout] User changed - resetting navigation');
      }
    }
  }, [user?.id, lastUserId]);

  // Let AuthProvider handle loading state - no additional loading here

  // Check for preview role to show banner
  const previewRole = typeof window !== 'undefined' ? localStorage.getItem('preview_role') as UserRole | null : null;
  const isPreviewActive = isAdmin && previewRole && previewRole !== 'admin';

  return (
    <TourProvider>
    <div className="min-h-screen bg-background">
      {/* Global Search Palette (⌘K) */}
      {isAdmin && <GlobalSearchPalette open={searchOpen} onOpenChange={setSearchOpen} />}

      {/* Dev Mode Preview Banner */}
      {!isLoginPage && isAuthenticated && isPreviewActive && (
        <DevModeBanner realRole="admin" previewRole={previewRole!} />
      )}
      
      {!isLoginPage && isAuthenticated && (
        <header className="bg-card shadow sticky top-0 z-50 safe-area-top">
          <div className="mx-auto px-2 sm:px-3 lg:px-4">
            <div className="flex h-14 items-center">
              {/* Logo — fixed small corner mark */}
              <div className="relative h-9 w-9 shrink-0 mr-2">
                <img src="/nysc-logo-light.png" alt="NYSC" className="h-full w-full object-contain dark:hidden" />
                <img src="/nysc-logo-dark.png" alt="NYSC" className="h-full w-full object-contain hidden dark:block" />
              </div>

              {/* Desktop Navigation — takes available space */}
              <div className="hidden md:block flex-1 overflow-hidden" data-tour="nav-bar">
                {navReady ? (
                  <DesktopNavigationImproved
                    navigation={navigation}
                    onSignOut={signOut}
                  />
                ) : showRefreshButton ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      logger.debug('[Layout] Manual refresh triggered');
                      refetch();
                      setShowRefreshButton(false);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                ) : (
                  <NavigationSkeleton />
                )}
              </div>

              {/* Mobile spacer (pushes right items when nav is hidden) */}
              <div className="flex-1 md:hidden" />

              {/* Right utilities — never shrink */}
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {/* Search button */}
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

                {/* Admin Notifications */}
                {isAdmin && (
                  <div data-tour="notification-box">
                    <NotificationBox />
                  </div>
                )}
                
                {/* Theme Toggle — desktop only */}
                <div className="hidden sm:block" data-tour="theme-toggle">
                  <ThemeToggle />
                </div>

                {/* Profile Avatar */}
                <button
                  className="focus:outline-none p-0.5 rounded-full hover:bg-muted/50 transition-colors shrink-0"
                  title={`${(profile as any)?.first_name || ''} ${(profile as any)?.last_name || ''} — Profile`}
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
                
                {/* Mobile Menu */}
                <div className="md:hidden">
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
                        logger.debug('[Layout] Manual refresh triggered');
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
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Global Onboarding Wizard overlay (after header to ensure correct stacking order) */}
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
      {/* Help Button */}
      {isAuthenticated && !isLoginPage && <HelpButton />}
    </div>
    </TourProvider>
  );
};

export default Layout;
