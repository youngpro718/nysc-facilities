import React from "react";
import { Home, Key, AlertCircle, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const TABS = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "Requests", icon: Key, path: "/my-requests" },
  { label: "Issues", icon: AlertCircle, path: "/my-issues" },
  { label: "Profile", icon: User, path: "/profile" },
];

export const BottomTabNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border flex justify-around items-center h-16 shadow-lg md:hidden pb-safe">
      {TABS.map(({ label, icon: Icon, path }) => {
        const isActive = location.pathname === path;
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
