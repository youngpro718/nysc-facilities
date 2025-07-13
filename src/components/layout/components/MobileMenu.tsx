
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { NavigationTab } from "../types";
import { MobileNavigationGrid } from "./MobileNavigationGrid";
import { useAuthSession } from "@/hooks/useAuthSession";

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
  const { isAdmin } = useAuthSession();
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
        className="w-[85%] sm:w-[385px] border-l border-border bg-background safe-area-right"
      >
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="text-lg font-semibold">Navigation</SheetTitle>
        </SheetHeader>
        
        <MobileNavigationGrid
          items={navigationItems}
          onSignOut={onSignOut}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
};

// Helper functions to map navigation items to paths and descriptions
function getNavigationPath(title: string, isAdmin?: boolean): string {
  const pathMap: Record<string, string> = {
    'Dashboard': isAdmin ? '/' : '/dashboard',
    'Spaces': '/spaces',
    'Issues': '/issues',
    'Occupants': '/occupants',
    'Keys': '/keys',
    'Lighting': '/lighting',
    'My Requests': '/my-requests',
    'My Issues': '/my-issues',
    'Admin Profile': '/admin-profile',
    'Profile': '/profile',
  };
  return pathMap[title] || '/';
}

function getNavigationDescription(title: string): string {
  const descriptionMap: Record<string, string> = {
    'Dashboard': 'Overview & stats',
    'Spaces': 'Manage buildings',
    'Issues': 'Track problems',
    'Occupants': 'Manage people',
    'Keys': 'Key management',
    'Lighting': 'Control lights',
    'My Requests': 'View your submitted requests',
    'My Issues': 'Track your reported issues',
    'Admin Profile': 'Admin settings',
    'Profile': 'Your account',
  };
  return descriptionMap[title] || '';
}
