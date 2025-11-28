import React from "react";
import { User, Settings, LogOut, Shield, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const MoreTabContent: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading } = useAuth();

  const handleSignOut = async () => {
    try {
      console.log("MoreTabContent: Starting sign out...");
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      navigate("/login");
    } catch (error) {
      console.error("MoreTabContent: Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    {
      icon: User,
      label: "Profile Settings",
      action: () => navigate("/profile"),
    },
    {
      icon: Settings,
      label: "Account Settings",
      action: () => navigate("/profile"),
    },
    {
      icon: Shield,
      label: "Admin Panel",
      action: () => navigate("/admin-profile"),
      adminOnly: true,
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      action: () => {
        // TODO: Add help/support functionality
        toast({
          title: "Coming Soon",
          description: "Help & Support feature is coming soon!",
        });
      },
    },
  ];

  // Show loading state while auth is being resolved
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background/95 backdrop-blur-sm">
        <div className="flex-1 p-4 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log("MoreTabContent: Rendering with user:", user?.id, "isAdmin:", isAdmin);

  return (
    <div className="flex flex-col h-full bg-background/95 backdrop-blur-sm">
      <div className="flex-1 p-4 space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground">
            Manage your profile and settings
          </p>
        </div>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            // Skip admin items for non-admin users - use isAdmin from auth context
            if (item.adminOnly && !isAdmin) {
              console.log("MoreTabContent: Skipping admin item for non-admin user");
              return null;
            }

            return (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start h-12 text-left"
                onClick={item.action}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>

        <Separator />

        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-left text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <div className="p-4 pt-0">
        <div className="text-xs text-muted-foreground text-center">
          Version 1.0.0
        </div>
      </div>
    </div>
  );
};