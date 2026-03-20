
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logger } from '@/lib/logger';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { NavigationTab, Tab } from "../types";
import { MobileNavigationGrid } from "./MobileNavigationGrid";
import { useAuth } from "@features/auth/hooks/useAuth";
import { isAdminRole } from "@/routes/roleBasedRouting";
import { getNavigationPath, getNavigationDescription } from "../utils/navigationPaths";

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
  const { profile } = useAuth();
  const isAdminTier = isAdminRole(profile?.role);
  // Convert navigation tabs to grid items, filtering out separators
  const navigationItems = navigation
    .filter(item => item.type !== "separator")
    .map((item, index) => {
      // Type assertion since we know these are not separators
      const navItem = item as Tab;
      return {
        title: navItem.title,
        icon: navItem.icon,
        path: getNavigationPath(navItem.title, isAdminTier),
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
        side="left"
        className="w-[85%] sm:w-[385px] border-r border-border bg-background safe-area-left flex flex-col"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <SheetHeader className="border-b border-border pb-4 shrink-0">
          <SheetTitle className="text-lg font-semibold text-left">Menu</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
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

