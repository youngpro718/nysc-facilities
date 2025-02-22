
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useSessionManagement } from "./hooks/useSessionManagement";
import { adminNavigation, userNavigation, getNavigationRoutes } from "./config/navigation";
import { MobileMenu } from "./components/MobileMenu";
import { DesktopNavigation } from "./components/DesktopNavigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRound } from "lucide-react";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoading, isAdmin, initialCheckComplete } = useSessionManagement(isLoginPage);
  const [profile, setProfile] = useState<{ first_name?: string; last_name?: string; avatar_url?: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  useEffect(() => {
    if (!isLoginPage && initialCheckComplete && !isLoading) {
      fetchProfile();
    }
  }, [fetchProfile, isLoginPage, initialCheckComplete, isLoading]);

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

        localStorage.removeItem('app-auth');
        sessionStorage.clear();
        
        await supabase.auth.signOut({ scope: 'local' });
        await supabase.auth.signOut({ scope: 'global' });
        
        toast.success("Successfully signed out!");
      }
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Error signing out");
    }
  };

  const handleNavigationChange = async (index: number | null) => {
    if (index === null) return;
    
    const routes = getNavigationRoutes(isAdmin);
    const route = routes[index];
    if (route) {
      navigate(route);
      setIsMobileMenuOpen(false);
    }
  };

  // Don't render anything until initial auth check is complete
  if (!initialCheckComplete || isLoading) {
    return null;
  }

  const navigation = isAdmin ? adminNavigation : userNavigation;

  return (
    <div className="min-h-screen bg-background">
      {!isLoginPage && (
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
                {!isLoginPage && (
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
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback>
                        <UserRound className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                
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
