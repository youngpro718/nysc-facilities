import React, { useState } from "react";
import { User, Settings, LogOut, Shield, HelpCircle, Mail, Phone, ExternalLink, FileText, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const MoreTabContent: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading } = useAuth();
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

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
      action: () => setHelpDialogOpen(true),
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

      {/* Help & Support Dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Help & Support
            </DialogTitle>
            <DialogDescription>
              Get help with the NYSC Facilities Management System
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Quick Links */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Quick Links</h4>
              <div className="grid gap-2">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3"
                  onClick={() => {
                    navigate('/forms/issue-report');
                    setHelpDialogOpen(false);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Report an Issue</div>
                    <div className="text-xs text-muted-foreground">Submit a facility issue or request</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3"
                  onClick={() => {
                    navigate('/forms/supply-request');
                    setHelpDialogOpen(false);
                  }}
                >
                  <FileText className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Request Supplies</div>
                    <div className="text-xs text-muted-foreground">Order office supplies and materials</div>
                  </div>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Contact Support</h4>
              <div className="space-y-2 text-sm">
                <a 
                  href="mailto:facilities@nycourts.gov" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  facilities@nycourts.gov
                </a>
                <a 
                  href="tel:+12125551234" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  (212) 555-1234
                </a>
              </div>
            </div>

            <Separator />

            {/* System Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">System Information</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>NYSC Facilities Management System v1.0.0</p>
                <p>User ID: {user?.id?.slice(0, 8)}...</p>
                <p>Role: {isAdmin ? 'Administrator' : 'Standard User'}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};