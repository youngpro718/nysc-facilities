import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { adminNavigation, userNavigation, getNavigationRoutes } from "./config/navigation";
import { MobileMenu } from "./components/MobileMenu";
import { DesktopNavigation } from "./components/DesktopNavigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRound, Loader2 } from "lucide-react";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, isAdmin, isLoading, profile, signOut } = useAuth();

  const handleNavigationChange = (index: number | null) => {
    if (index === null) return;
    const routes = getNavigationRoutes(isAdmin);
    const route = routes[index];
    if (route) {
      navigate(route);
      setIsMobileMenuOpen(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!isLoginPage && isAuthenticated && (
        <header className="bg-card shadow sticky top-0 z-50">
          <div className="mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/ca12c24b-cc46-4318-b46d-8af88c0deae9.png" 
                  alt="NYSC Logo" 
                  className="h-10 w-10"
                />
                <h1 className="text-xl font-bold text-foreground">NYSC Facilities Hub</h1>
              </div>

              <div className="flex items-center gap-4">
                {/* Profile Section */}
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-medium">
                      {profile?.first_name} {profile?.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isAdmin ? 'Administrator' : 'User'}
                    </span>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      <UserRound className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Mobile Menu */}
                <div className="md:hidden">
                  <MobileMenu
                    isOpen={isMobileMenuOpen}
                    onOpenChange={setIsMobileMenuOpen}
                    navigation={isAdmin ? adminNavigation : userNavigation}
                    onNavigationChange={handleNavigationChange}
                    onSignOut={signOut}
                  />
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4">
                  <DesktopNavigation
                    navigation={isAdmin ? adminNavigation : userNavigation}
                    onNavigationChange={handleNavigationChange}
                    onSignOut={signOut}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
