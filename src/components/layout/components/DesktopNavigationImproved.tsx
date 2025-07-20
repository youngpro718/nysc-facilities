import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavigationTab } from "../types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

interface DesktopNavigationImprovedProps {
  navigation: NavigationTab[];
  onSignOut: () => void;
}

export const DesktopNavigationImproved = ({
  navigation,
  onSignOut
}: DesktopNavigationImprovedProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const handleNavigation = (title: string) => {
    const pathMap: Record<string, string> = {
      'Dashboard': isAdmin ? '/' : '/dashboard',
      'Spaces': '/spaces',
      'Operations': '/operations',
      'Issues': '/issues',
      'Occupants': '/occupants',
      'Inventory': '/inventory',
      'Supply Requests': '/admin/supply-requests',
      'Keys': '/keys',
      'Lighting': '/lighting',
      'Maintenance': '/maintenance',
      'Court Operations': '/court-operations',
      'My Requests': '/my-requests',
      'My Issues': '/my-issues',
      'Admin Profile': '/admin-profile',
      'Profile': '/profile',
    };
    const path = pathMap[title];
    if (path) {
      navigate(path);
    }
  };

  return (
    <TooltipProvider>
      <nav className="hidden md:flex items-center gap-2">
        {navigation.map((item, index) => {
          if (item.type === "separator") {
            return (
              <div 
                key={`separator-${index}`} 
                className="mx-2 h-6 w-px bg-border" 
                aria-hidden="true" 
              />
            );
          }

          // Type assertion since we know this is not a separator
          const navItem = item as { title: string; icon: any };
          const Icon = navItem.icon;
          const isActive = location.pathname === getNavigationPath(navItem.title, isAdmin);
          
          return (
            <Tooltip key={navItem.title}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNavigation(navItem.title)}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  aria-label={navItem.title}
                >
                  <Icon className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-sm">
                {navItem.title}
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {/* Sign Out Button */}
        <div className="ml-2 pl-2 border-l border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onSignOut}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 hover:scale-105 active:scale-95"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-sm">
              Sign out
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </TooltipProvider>
  );
};

// Helper function to get navigation path
function getNavigationPath(title: string, isAdmin?: boolean): string {
  const pathMap: Record<string, string> = {
    'Dashboard': isAdmin ? '/' : '/dashboard',
    'Spaces': '/spaces',
    'Operations': '/operations',
    'Issues': '/issues',
    'Occupants': '/occupants',
    'Inventory': '/inventory',
    'Supply Requests': '/admin/supply-requests',
    'Keys': '/keys',
    'Lighting': '/lighting',
    'Maintenance': '/maintenance',
    'Court Operations': '/court-operations',
    'My Requests': '/my-requests',
    'My Issues': '/my-issues',
    'Admin Profile': '/admin-profile',
    'Profile': '/profile',
  };
  return pathMap[title] || '/';
}