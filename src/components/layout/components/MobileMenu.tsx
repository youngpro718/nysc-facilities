
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { NavigationTab } from "../types";

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
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
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
        className="w-[85%] sm:w-[385px] border-l border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75"
      >
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 pt-6">
          <ExpandableTabs 
            tabs={navigation as any}
            className="flex-col !bg-transparent"
            onChange={onNavigationChange}
          />
          <Button
            onClick={onSignOut}
            className="w-full mt-4"
            variant="destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
