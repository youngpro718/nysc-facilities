
import { LogOut } from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { NavigationTab } from "../types";

interface DesktopNavigationProps {
  navigation: NavigationTab[];
  onNavigationChange: (index: number | null) => void;
  onSignOut: () => void;
}

export const DesktopNavigation = ({
  navigation,
  onNavigationChange,
  onSignOut
}: DesktopNavigationProps) => {
  return (
    <nav className="hidden md:flex items-center gap-4">
      <ExpandableTabs 
        tabs={navigation as any} 
        className="border-white/20 bg-transparent"
        onChange={onNavigationChange}
      />
      <button
        onClick={onSignOut}
        className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        title="Logout"
      >
        <LogOut size={20} />
      </button>
    </nav>
  );
};
