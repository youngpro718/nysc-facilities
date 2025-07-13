import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LucideIcon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavigationItem {
  title: string;
  icon: LucideIcon;
  path: string;
  description?: string;
}

interface MobileNavigationGridProps {
  items: NavigationItem[];
  onSignOut: () => void;
  onClose: () => void;
}

export const MobileNavigationGrid: React.FC<MobileNavigationGridProps> = ({
  items,
  onSignOut,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = () => {
    onSignOut();
    onClose();
  };

  return (
    <div className="p-4 space-y-6">
      {/* Navigation Grid */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.title}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 active:scale-95",
                isActive
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/20 hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "p-3 rounded-lg transition-colors",
                isActive 
                  ? "bg-primary/10" 
                  : "bg-muted"
              )}>
                <Icon className={cn(
                  "h-6 w-6 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-sm font-medium",
                  isActive ? "text-primary" : "text-foreground"
                )}>
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Sign Out Section */}
      <div className="pt-4 border-t border-border">
        <Button
          onClick={handleSignOut}
          variant="destructive"
          className="w-full h-12 text-base"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};