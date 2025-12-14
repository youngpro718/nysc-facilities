/**
 * Floating Action Button (FAB) - Quick Actions Menu
 * 
 * Provides quick access to common actions from anywhere in the app.
 * Expands to show options when clicked.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  X, 
  Package, 
  Key, 
  AlertTriangle,
  Wrench,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'supply',
    label: 'Request Supplies',
    icon: Package,
    path: '/forms/supply-request',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    id: 'key',
    label: 'Request Key',
    icon: Key,
    path: '/forms/key-request',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    id: 'issue',
    label: 'Report Issue',
    icon: AlertTriangle,
    path: '/forms/issue-report',
    color: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    id: 'maintenance',
    label: 'Maintenance Request',
    icon: Wrench,
    path: '/forms/maintenance-request',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
];

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Don't show on form pages, login, or pages with their own FABs
  const hiddenPaths = ['/forms/', '/login', '/auth/', '/onboarding/', '/spaces', '/supply'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  // Only show on mobile
  if (!isMobile) {
    return null;
  }

  const handleAction = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div className="fixed bottom-24 right-4 z-50 md:hidden flex flex-col-reverse items-end gap-3 pb-safe">
        {/* Quick Action Buttons */}
        {isOpen && quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className="flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="bg-card px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                {action.label}
              </span>
              <Button
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full shadow-lg",
                  action.color,
                  "text-white"
                )}
                onClick={() => handleAction(action.path)}
              >
                <Icon className="h-5 w-5" />
              </Button>
            </div>
          );
        })}

        {/* Main FAB Button */}
        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-xl transition-transform",
            isOpen 
              ? "bg-destructive hover:bg-destructive/90 rotate-45" 
              : "bg-primary hover:bg-primary/90"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </div>
    </>
  );
}
