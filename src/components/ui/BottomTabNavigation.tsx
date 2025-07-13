import React, { useState } from "react";
import { Home, Key, AlertCircle, User, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MoreTabContent } from "@/components/navigation/MoreTabContent";

const TABS = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "Requests", icon: Key, path: "/my-requests" },
  { label: "Issues", icon: AlertCircle, path: "/my-issues" },
  { label: "More", icon: User, path: "/profile" },
];

export const BottomTabNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border flex justify-around items-center h-16 shadow-lg md:hidden pb-safe">
      {TABS.map(({ label, icon: Icon, path }) => {
        const isActive = location.pathname === path || (label === "More" && location.pathname.startsWith("/profile"));
        
        if (label === "More") {
          return (
            <Sheet key={label} open={isMoreSheetOpen} onOpenChange={setIsMoreSheetOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label={label}
                  className={`flex flex-col items-center justify-center gap-0.5 text-xs px-2 py-2 focus:outline-none transition-colors min-w-0 flex-1 ${
                    isActive 
                      ? "text-primary font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "stroke-2" : "stroke-1.5"}`} />
                  <span className="truncate max-w-full">{label}</span>
                </button>
              </SheetTrigger>
              <SheetContent 
                side="bottom" 
                className="h-[85vh] p-0 rounded-t-xl"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">More Options</h2>
                  <button
                    onClick={() => setIsMoreSheetOpen(false)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <MoreTabContent />
              </SheetContent>
            </Sheet>
          );
        }
        
        return (
          <button
            key={label}
            aria-label={label}
            className={`flex flex-col items-center justify-center gap-0.5 text-xs px-2 py-2 focus:outline-none transition-colors min-w-0 flex-1 ${
              isActive 
                ? "text-primary font-medium" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => navigate(path)}
          >
            <Icon className={`w-5 h-5 ${isActive ? "stroke-2" : "stroke-1.5"}`} />
            <span className="truncate max-w-full">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
