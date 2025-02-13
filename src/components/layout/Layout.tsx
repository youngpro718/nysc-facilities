import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  Users,
  Key,
  AlertCircle,
  LayoutDashboard,
  LogOut,
  UserRound,
  Menu,
  X,
} from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeviceInfo = {
  name: string;
  platform: string;
  language: string;
};

interface UserSession {
  id: string;
  user_id: string;
  device_info: DeviceInfo;
  last_active_at: string;
  created_at: string;
  ip_address?: string;
  location?: string;
}

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const getCurrentDeviceInfo = () => {
    const info = {
      name: navigator.userAgent.split('/')[0],
      platform: navigator.platform,
      language: navigator.language,
    };
    return info;
  };

  const findExistingSession = async (userId: string) => {
    const { data } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    return data;
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          navigate('/auth');
          return;
        }

        if (!session) {
          if (!isAuthPage) {
            navigate('/auth');
          }
          return;
        }

        if (isAuthPage) {
          navigate('/');
          return;
        }

        const deviceInfo = getCurrentDeviceInfo();

        try {
          const existingSession = await findExistingSession(session.user.id);

          if (existingSession?.id) {
            await supabase
              .from('user_sessions')
              .update({
                last_active_at: new Date().toISOString(),
                device_info: deviceInfo
              })
              .eq('id', existingSession.id);
          } else {
            const sessionData = {
              user_id: session.user.id,
              device_info: deviceInfo,
              last_active_at: new Date().toISOString()
            };

            await supabase
              .from('user_sessions')
              .insert([sessionData]);
          }

          // Check if user is admin
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          setIsAdmin(roleData?.role === 'admin');
        } catch (error) {
          console.error("Session management error:", error);
        }
      } catch (error) {
        console.error("Auth error:", error);
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        if (isAuthPage) {
          navigate('/');
        }
      } else if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    // Update session activity periodically
    const updateInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const deviceInfo = getCurrentDeviceInfo();
        const existingSession = await findExistingSession(session.user.id);

        if (existingSession?.id) {
          await supabase
            .from('user_sessions')
            .update({
              last_active_at: new Date().toISOString(),
              device_info: deviceInfo
            })
            .eq('id', existingSession.id);
        }
      }
    }, 5 * 60 * 1000); // Update every 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(updateInterval);
    };
  }, [navigate, isAuthPage]);

  const handleSignOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Find and delete the session
        const existingSession = await findExistingSession(session.user.id);
        if (existingSession?.id) {
          await supabase
            .from('user_sessions')
            .delete()
            .eq('id', existingSession.id);
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

  const adminNavigation = [
    { title: "Dashboard", icon: LayoutDashboard },
    { title: "Spaces", icon: Building2 },
    { title: "Occupants", icon: Users },
    { type: "separator" as const },
    { title: "Keys", icon: Key },
    { title: "Issues", icon: AlertCircle },
    { type: "separator" as const },
    { title: "Admin Profile", icon: UserRound },
  ];

  const userNavigation = [
    { title: "Dashboard", icon: LayoutDashboard },
    { type: "separator" as const },
    { title: "Profile", icon: UserRound },
  ];

  const navigation = isAdmin ? adminNavigation : userNavigation;

  const handleNavigationChange = async (index: number | null) => {
    if (index === null) return;
    
    if (isAdmin) {
      const routes = ['/', '/spaces', '/occupants', null, '/keys', '/issues', null, '/admin/profile'];
      const route = routes[index];
      if (route) {
        navigate(route);
        setIsMobileMenuOpen(false);
      }
    } else {
      const routes = ['/dashboard', null, '/profile'];
      const route = routes[index];
      if (route) {
        navigate(route);
        setIsMobileMenuOpen(false);
      }
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
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="relative"
                      aria-label="Toggle menu"
                    >
                      {isMobileMenuOpen ? (
                        <X className="h-5 w-5" />
                      ) : (
                        <Menu className="h-5 w-5" />
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent 
                    side="right" 
                    className="w-[85%] sm:w-[385px] border-l border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75"
                  >
                    <SheetHeader className="border-b border-border pb-4">
                      <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col gap-4 pt-6">
                      <ExpandableTabs 
                        tabs={navigation}
                        className="flex-col !bg-transparent"
                        onChange={handleNavigationChange}
                      />
                      <Button
                        onClick={handleSignOut}
                        className="w-full mt-4"
                        variant="destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-4">
                <ExpandableTabs 
                  tabs={navigation} 
                  className="border-white/20 bg-transparent"
                  onChange={handleNavigationChange}
                />
                <button
                  onClick={handleSignOut}
                  className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <LogOut size={20} />
                </button>
              </nav>
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
