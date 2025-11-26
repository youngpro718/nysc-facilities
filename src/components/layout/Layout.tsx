
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getRoleBasedNavigation, getNavigationRoutes } from "./config/navigation";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { MobileMenu } from "./components/MobileMenu";
import { BottomTabBar } from "./components/BottomTabBar";
import { DesktopNavigationImproved } from "./components/DesktopNavigationImproved";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBox } from "@/components/admin/NotificationBox";
import { Loader2, RefreshCw } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Button } from "@/components/ui/button";
import { NavigationSkeleton, MobileNavigationSkeleton } from "./NavigationSkeleton";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { logger } from "@/lib/logger";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
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
        console.warn('[Layout] Navigation stuck loading for 5s, showing refresh button');
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

  return (
    <div className="min-h-screen bg-background">
      {!isLoginPage && isAuthenticated && (
        <header className="bg-card shadow sticky top-0 z-50 safe-area-top">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-12 sm:h-16 items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative h-12 w-12 sm:h-14 sm:w-14">
                  {/* Light mode logo - navy blue */}
                  <img 
                    src="/nysc-logo-light.png" 
                    alt="NYSC Facilities Hub Logo" 
                    className="h-full w-full object-contain dark:hidden"
                  />
                  {/* Dark mode logo - light/white */}
                  <img 
                    src="/nysc-logo-dark.png" 
                    alt="NYSC Facilities Hub Logo" 
                    className="h-full w-full object-contain hidden dark:block"
                  />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  NYSC Facilities Hub
                </h1>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                {/* Admin Notifications */}
                {isAdmin && (
                  <NotificationBox />
                )}
                
                {/* Theme Toggle - Hidden on mobile for space */}
                <div className="hidden sm:block">
                  <ThemeToggle />
                </div>

                {/* Profile Section */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden lg:flex flex-col items-end">
                    <span className="text-sm font-medium">
                      {profile?.first_name} {profile?.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {profile?.title || (navReady ? (userRole === 'admin' ? 'Administrator' : 'User') : '')}
                    </span>
                  </div>
                  <button
                    className="focus:outline-none p-1 rounded-full hover:bg-muted/50 transition-colors"
                    title="Profile"
                    onClick={() => {
                      // OPTIMIZATION: Allow navigation even while loading, use best guess
                      const goAdmin = userRole === 'admin' || isAdmin;
                      navigate(goAdmin ? '/admin-profile' : '/profile');
                    }}
                  >
                    <UserAvatar
                      src={profile?.avatar_url}
                      firstName={profile?.first_name}
                      lastName={profile?.last_name}
                      className="h-9 w-9 sm:h-8 sm:w-8"
                      showFallbackIcon
                    />
                  </button>
                </div>
                
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
                        console.log('[Layout] Manual refresh triggered');
                        refetch();
                        setShowRefreshButton(false);
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  ) : (
                    // OPTIMIZATION: Show skeleton instead of spinner
                    <MobileNavigationSkeleton />
                  )}
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4">
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
                        console.log('[Layout] Manual refresh triggered');
                        refetch();
                        setShowRefreshButton(false);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  ) : (
                    // OPTIMIZATION: Show skeleton instead of spinner for better UX
                    <NavigationSkeleton />
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
    </div>
  );
};

export default Layout;
