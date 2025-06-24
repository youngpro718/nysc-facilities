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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center h-16 shadow-lg md:hidden">
      {TABS.map(({ label, icon: Icon, path }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={label}
            aria-label={label}
            className={`flex flex-col items-center justify-center gap-1 text-xs px-2 py-1 focus:outline-none transition-colors ${
              isActive ? "text-primary" : "text-gray-500 dark:text-gray-400"
            }`}
            onClick={() => navigate(path)}
          >
            <Icon className={`w-6 h-6 mb-0.5 ${isActive ? "stroke-2" : "stroke-1.5"}`} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
