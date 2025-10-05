
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

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const { isAuthenticated, isAdmin, isLoading, signOut, user } = useAuth();
  const { permissions, userRole, profile, loading: permissionsLoading, refetch } = useRolePermissions();
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

  // Only build navigation once permissions are ready to avoid flashing the wrong menu after login
  const navReady = !!userRole && !permissionsLoading;
  const navigation = navReady 
    ? getRoleBasedNavigation(permissions, userRole, profile) 
    : [];
    
  console.log('Layout - userRole:', userRole, 'permissionsLoading:', permissionsLoading);
  console.log('Layout - isAdmin:', isAdmin);
  console.log('Layout - user:', user?.id);
  console.log('Layout - profile:', profile);
  console.log('Layout - navigation:', navigation);

  // Show refresh button if permissions are stuck loading for >8 seconds
  useEffect(() => {
    if (!navReady && isAuthenticated && !isLoginPage) {
      const timer = setTimeout(() => {
        console.warn('[Layout] Navigation stuck loading for 8s, showing refresh button');
        setShowRefreshButton(true);
      }, 8000);
      
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

  // Let AuthProvider handle loading state - no additional loading here

  return (
    <div className="min-h-screen bg-background">
      {!isLoginPage && isAuthenticated && (
        <header className="bg-card shadow sticky top-0 z-50 safe-area-top">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-12 sm:h-16 items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <img 
                  src="/nysc-logo.png" 
                  alt="NYSC Facilities Hub Logo" 
                  className="h-8 w-8 sm:h-10 sm:w-10"
                />
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
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
                      {navReady ? (userRole === 'admin' ? 'Administrator' : 'User') : ''}
                    </span>
                  </div>
                  <button
                    className="focus:outline-none p-1 rounded-full hover:bg-muted/50 transition-colors disabled:opacity-50"
                    title="Profile"
                    disabled={!navReady}
                    onClick={() => {
                      if (!navReady) return;
                      // Use resolved userRole to avoid transient misroutes
                      const goAdmin = userRole === 'admin';
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
                    // Minimal placeholder to avoid flicker
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
                    // Minimal placeholder to avoid flicker
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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

      <main className="flex-1 pb-20 md:pb-0 pb-safe">
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
    </div>
  );
};

export default Layout;
