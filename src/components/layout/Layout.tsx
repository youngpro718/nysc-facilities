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

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        } else if (isAuthPage) {
          navigate('/');
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

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, isAuthPage]);

  const navigation = [
    { title: "Dashboard", icon: LayoutDashboard },
    { title: "Spaces", icon: Building2 },
    { title: "Occupants", icon: Users },
    { type: "separator" as const },
    { title: "Keys", icon: Key },
    { title: "Issues", icon: AlertCircle },
    { type: "separator" as const },
    { title: "Profile", icon: UserRound },
  ];

  const handleNavigationChange = (index: number | null) => {
    if (index === null) return;
    const routes = ['/', '/spaces', '/occupants', null, '/keys', '/issues', null, '/profile'];
    const route = routes[index];
    if (route) {
      navigate(route);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Successfully signed out!");
      navigate('/auth');
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Error signing out");
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner
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
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;