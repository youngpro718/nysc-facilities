
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getRoleBasedNavigation, userNavigation, getNavigationRoutes } from "./config/navigation";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { MobileMenu } from "./components/MobileMenu";
import { DesktopNavigationImproved } from "./components/DesktopNavigationImproved";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBox } from "@/components/admin/NotificationBox";
import { UserRound, Loader2 } from "lucide-react";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, isAdmin, isLoading, signOut, user } = useAuth();
  const { permissions, userRole, profile, loading: permissionsLoading } = useRolePermissions();
  const [demoMode, setDemoMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      setDemoMode(localStorage.getItem('DEMO_MODE') === 'true');
    } catch { /* no-op */ }
  }, [location.pathname]);

  const disableDemoMode = () => {
    try {
      localStorage.removeItem('DEMO_MODE');
    } catch { /* no-op */ }
    setDemoMode(false);
    navigate('/login');
  };

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

  const handleNavigationChange = (index: number | null) => {
    if (index === null) return;

    // If userRole not ready yet, use a safe default (standard user routes)
    const routes = userRole
      ? getNavigationRoutes(permissions, userRole, profile)
      : getNavigationRoutes(
          {
            spaces: null,
            issues: null,
            occupants: null,
            inventory: null,
            supply_requests: null,
            keys: null,
            lighting: null,
            maintenance: null,
            court_operations: null,
            operations: null,
            dashboard: null,
          } as any,
          'standard' as any,
          undefined
        );

    const route = routes[index];
    if (route) {
      navigate(route);
      setIsMobileMenuOpen(false);
    }
  };

  // Let AuthProvider handle loading state - no additional loading here

  return (
    <div className="min-h-screen bg-background">
      {demoMode && (
        <div className="w-full bg-amber-100 text-amber-900 border-b border-amber-200 py-2 px-4 text-sm flex items-center justify-between">
          <div>
            Demo Mode is enabled — authentication is bypassed and all modules are accessible.
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={disableDemoMode}>
              Disable Demo Mode
            </Button>
          </div>
        </div>
      )}
      {!isLoginPage && isAuthenticated && (
        <header className="bg-card shadow sticky top-0 z-50 safe-area-top">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 sm:h-16 items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <img 
                  src="/lovable-uploads/ca12c24b-cc46-4318-b46d-8af88c0deae9.png" 
                  alt="NYSC Logo" 
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
                      {isAdmin ? 'Administrator' : 'User'}
                    </span>
                  </div>
                  <button
                    className="focus:outline-none p-1 rounded-full hover:bg-muted/50 transition-colors"
                    title="Profile"
                    onClick={() => {
                      // Navigate to appropriate profile page based on user role
                      navigate(isAdmin ? '/admin-profile' : '/profile');
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
                  ) : isAuthenticated ? (
                    <MobileMenu
                      isOpen={isMobileMenuOpen}
                      onOpenChange={setIsMobileMenuOpen}
                      navigation={userNavigation}
                      onNavigationChange={handleNavigationChange}
                      onSignOut={signOut}
                    />
                  ) : (
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
                  ) : isAuthenticated ? (
                    <DesktopNavigationImproved
                      navigation={userNavigation}
                      onSignOut={signOut}
                    />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 pb-safe">
        <div className="mx-auto max-w-none xl:max-w-[95%] 2xl:max-w-[90%] px-3 sm:px-4 lg:px-8 xl:px-12 py-4 sm:py-8 xl:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
