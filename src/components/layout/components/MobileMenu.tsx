
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { NavigationTab } from "../types";
import { MobileNavigationGrid } from "./MobileNavigationGrid";
import { useAuth } from "@/hooks/useAuth";

interface MobileMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  navigation: NavigationTab[];
  onNavigationChange: (index: number | null) => void;
  onSignOut: () => void;
}

export const MobileMenu = ({
  isOpen,
  onOpenChange,
  navigation,
  onNavigationChange,
  onSignOut
}: MobileMenuProps) => {
  const { isAdmin } = useAuth();
  // Convert navigation tabs to grid items, filtering out separators
  const navigationItems = navigation
    .filter(item => item.type !== "separator")
    .map((item, index) => {
      // Type assertion since we know these are not separators
      const navItem = item as { title: string; icon: any };
      return {
        title: navItem.title,
        icon: navItem.icon,
        path: getNavigationPath(navItem.title, isAdmin),
        description: getNavigationDescription(navItem.title),
      };
    });

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative h-9 w-9"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-[85%] sm:w-[385px] border-l border-border bg-background safe-area-right pt-safe-top pb-safe-bottom flex flex-col"
      >
        <SheetHeader className="border-b border-border pb-4 shrink-0">
          <SheetTitle className="text-lg font-semibold">Navigation</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <MobileNavigationGrid
            items={navigationItems}
            onSignOut={onSignOut}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Helper functions to map navigation items to paths and descriptions
function getNavigationPath(title: string, isAdmin?: boolean): string {
  const pathMap: Record<string, string> = {
    'Dashboard': isAdmin ? '/' : '/dashboard',
    'Spaces': '/spaces',
    'Operations': '/operations', // Contains Issues, Maintenance, Supply Requests
    'Issues': '/issues',
    'Access & Assignments': '/access-assignments',
    'Occupants': '/occupants',
    'Inventory': '/inventory',
    'Tasks': '/tasks',
    'Supplies': '/tasks',
    'Supply Requests': isAdmin ? '/admin/supply-requests' : '/supply-requests',
    'Supply Room': '/supply-room',
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
  if (!path) {
    console.warn('MobileMenu: Unmapped navigation title', title);
    return '/';
  }
  return path;
}

function getNavigationDescription(title: string): string {
  const descriptionMap: Record<string, string> = {
    'Dashboard': 'Overview & stats',
    'Spaces': 'Manage buildings',
    'Operations': 'Issues, Maintenance, Supplies',
    'Issues': 'Track problems',
    'Access & Assignments': 'Access levels & assignments',
    'Occupants': 'Manage people',
    'Inventory': 'Stock & assets',
    'Tasks': 'Staff task management',
    'Supplies': 'Staff task management',
    'Supply Requests': 'Request and track supplies',
    'Supply Room': 'Supply room management',
    'Keys': 'Key management',
    'Lighting': 'Control lights',
    'Maintenance': 'Schedule & track maintenance',
    'Court Operations': 'Manage court schedules',
    'My Requests': 'View your submitted requests',
    'My Issues': 'Track your reported issues',
    'Admin Profile': 'Admin settings',
    'Profile': 'Your account',
  };
  return descriptionMap[title] || '';
}
