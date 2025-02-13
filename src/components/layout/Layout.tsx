
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSessionManagement } from "./hooks/useSessionManagement";
import { adminNavigation, userNavigation, getNavigationRoutes } from "./config/navigation";
import { MobileMenu } from "./components/MobileMenu";
import { DesktopNavigation } from "./components/DesktopNavigation";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoading, isAdmin } = useSessionManagement(isAuthPage);

  const handleSignOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('user_sessions')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle();

        if (data?.id) {
          await supabase
            .from('user_sessions')
            .delete()
            .eq('id', data.id);
        }
      }

      await supabase.auth.signOut();
      toast.success("Successfully signed out!");
      navigate('/auth');
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Error signing out");
    }
  };

  const navigation = isAdmin ? adminNavigation : userNavigation;

  const handleNavigationChange = async (index: number | null) => {
    if (index === null) return;
    
    const routes = getNavigationRoutes(isAdmin);
    const route = routes[index];
    if (route) {
      navigate(route);
      setIsMobileMenuOpen(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {!isAuthPage && (
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
              
              {/* Mobile Menu */}
              <div className="md:hidden">
                <MobileMenu
                  isOpen={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                  navigation={navigation}
                  onNavigationChange={handleNavigationChange}
                  onSignOut={handleSignOut}
                />
              </div>

              {/* Desktop Navigation */}
              <DesktopNavigation
                navigation={navigation}
                onNavigationChange={handleNavigationChange}
                onSignOut={handleSignOut}
              />
            </div>
          </div>
        </header>
      )}
      <main className={cn(
        "mx-auto max-w-7xl px-4 py-8",
        isAdmin && "bg-background"
      )}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
