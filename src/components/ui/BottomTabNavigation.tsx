import React, { useState } from "react";
import { Home, Key, AlertCircle, User, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border flex justify-around items-center shadow-lg md:hidden" 
      style={{ height: `calc(4rem + env(safe-area-inset-bottom))`, paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Primary navigation"
    >
      {TABS.map(({ label, icon: Icon, path }) => {
        const isActive = location.pathname === path || (label === "More" && location.pathname.startsWith("/profile"));
        
        if (label === "More") {
          return (
            <Sheet key={label} open={isMoreSheetOpen} onOpenChange={setIsMoreSheetOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label={label}
                  aria-expanded={isMoreSheetOpen}
                  className={`flex flex-col items-center justify-center gap-0.5 text-xs px-2 py-2 min-h-[48px] min-w-[48px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors active:scale-95 ${
                    isActive 
                      ? "text-primary font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className={`p-1 rounded-lg transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                    <Icon className={`w-5 h-5 ${isActive ? "stroke-2" : "stroke-1.5"}`} />
                  </div>
                  <span className="truncate max-w-full text-[10px] xs:text-xs">{label}</span>
                </button>
              </SheetTrigger>
              <SheetContent 
                side="bottom" 
                className="h-[85vh] p-0 rounded-t-xl"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <SheetHeader className="flex flex-row items-center justify-between p-4 border-b space-y-0">
                  <SheetTitle>More Options</SheetTitle>
                  <button
                    onClick={() => setIsMoreSheetOpen(false)}
                    className="p-2 hover:bg-muted rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </SheetHeader>
                <MoreTabContent />
              </SheetContent>
            </Sheet>
          );
        }
        
        return (
          <button
            key={label}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 text-xs px-2 py-2 min-h-[48px] min-w-[48px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors active:scale-95 ${
              isActive 
                ? "text-primary font-medium" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => navigate(path)}
          >
            <div className={`p-1 rounded-lg transition-colors ${isActive ? "bg-primary/10" : ""}`}>
              <Icon className={`w-5 h-5 ${isActive ? "stroke-2" : "stroke-1.5"}`} />
            </div>
            <span className="truncate max-w-full text-[10px] xs:text-xs">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
