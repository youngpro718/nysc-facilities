import { useState, useRef, useEffect } from 'react';
import { X, GripVertical, RotateCcw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDevMode } from '@/hooks/useDevMode';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useNavigate } from 'react-router-dom';
import { SYSTEM_ROLES, getRoleLabel, type UserRole } from '@/config/roles';
import { getDashboardForRole } from '@/utils/roleBasedRouting';

// Quick links organized by role
const ROLE_QUICK_LINKS: Record<UserRole, Array<{ label: string; path: string }>> = {
  admin: [
    { label: 'Dashboard', path: '/' },
    { label: 'Spaces', path: '/spaces' },
    { label: 'Keys', path: '/keys' },
    { label: 'Access', path: '/access-assignments' },
    { label: 'Users', path: '/users' },
  ],
  cmc: [
    { label: 'Dashboard', path: '/cmc-dashboard' },
    { label: 'Court Ops', path: '/court-operations' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'Operations', path: '/operations' },
  ],
  court_officer: [
    { label: 'Dashboard', path: '/court-officer-dashboard' },
    { label: 'Keys', path: '/keys' },
    { label: 'Spaces', path: '/spaces' },
    { label: 'Term Sheet', path: '/term-sheet' },
  ],
  court_aide: [
    { label: 'Work Center', path: '/court-aide-dashboard' },
    { label: 'Term Sheet', path: '/term-sheet' },
    { label: 'Supply Room', path: '/supply-room' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Tasks', path: '/tasks' },
  ],
  standard: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Activity', path: '/my-activity' },
    { label: 'Profile', path: '/profile' },
  ],
};

interface DevModePanelProps {
  /** The user's actual database role (not preview) */
  realRole: UserRole;
}

export function DevModePanel({ realRole }: DevModePanelProps) {
  const navigate = useNavigate();
  const { 
    isDevModeOpen, 
    position, 
    updatePosition, 
    closeDevMode,
    getPreviewRole,
    setPreviewRole,
    clearPreviewRole,
  } = useDevMode();
  
  const { userRole: effectiveRole } = useRolePermissions();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const previewRole = getPreviewRole();
  const isPreviewActive = previewRole !== null && previewRole !== realRole;

  // Get quick links for current effective role
  const quickLinks = ROLE_QUICK_LINKS[effectiveRole as UserRole] || ROLE_QUICK_LINKS.standard;

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!panelRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
    setIsDragging(true);
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const newX = window.innerWidth - clientX - (panelRef.current?.offsetWidth || 300) + dragOffset.x;
      const newY = window.innerHeight - clientY - (panelRef.current?.offsetHeight || 400) + dragOffset.y;
      
      // Clamp to viewport
      const clampedX = Math.max(0, Math.min(newX, window.innerWidth - 100));
      const clampedY = Math.max(0, Math.min(newY, window.innerHeight - 100));
      
      updatePosition({ x: clampedX, y: clampedY });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset, updatePosition]);

  if (!isDevModeOpen) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-[9999] w-72 rounded-lg border bg-card shadow-xl",
        "select-none",
        isDragging && "cursor-grabbing"
      )}
      style={{
        right: position.x,
        bottom: position.y,
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b bg-muted/50 rounded-t-lg cursor-grab"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">🔧 DEV MODE</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={closeDevMode}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Role Info */}
      <div className="px-3 py-2 border-b bg-muted/20">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Real:</span>
          <Badge variant="outline" className="text-xs py-0">
            {getRoleLabel(realRole)}
          </Badge>
          {isPreviewActive && (
            <>
              <span className="text-muted-foreground">→</span>
              <Badge className="text-xs py-0 bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">
                {getRoleLabel(previewRole)}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Role Switcher */}
      <div className="px-3 py-3 border-b">
        <Label className="text-xs font-medium text-muted-foreground mb-2 block">
          Switch Role:
        </Label>
        <RadioGroup
          value={previewRole || realRole}
          onValueChange={(value) => {
            // Clear any cached permissions to force fresh fetch
            const userId = localStorage.getItem('sb-fmymhtuiqzhupjyopfvi-auth-token');
            if (userId) {
              // Clear permission cache keys
              Object.keys(localStorage).forEach(key => {
                if (key.includes('permissions_cache')) {
                  localStorage.removeItem(key);
                }
              });
            }
            
            if (value === realRole) {
              clearPreviewRole();
            } else {
              setPreviewRole(value as UserRole);
            }
            
            // Dispatch event for permission refresh
            window.dispatchEvent(new CustomEvent('preview_role_changed'));
            
            // Small delay to let permissions update before navigating
            setTimeout(() => {
              navigate(getDashboardForRole(value as UserRole));
            }, 100);
          }}
          className="grid grid-cols-2 gap-2"
        >
          {SYSTEM_ROLES.map((role) => (
            <div key={role.value} className="flex items-center space-x-2">
              <RadioGroupItem 
                value={role.value} 
                id={`role-${role.value}`}
                className="h-3.5 w-3.5"
              />
              <Label 
                htmlFor={`role-${role.value}`}
                className="text-xs cursor-pointer"
              >
                {role.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Quick Links */}
      <div className="px-3 py-3 border-b">
        <Label className="text-xs font-medium text-muted-foreground mb-2 block">
          Quick Links:
        </Label>
        <div key={effectiveRole} className="flex flex-wrap gap-1.5">
          {quickLinks.map((link) => (
            <Button
              key={link.path}
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => navigate(link.path)}
            >
              {link.label}
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <div className="px-3 py-2">
        <Button
          variant="secondary"
          size="sm"
          className="w-full text-xs"
          onClick={clearPreviewRole}
          disabled={!isPreviewActive}
        >
          <RotateCcw className="h-3 w-3 mr-1.5" />
          Reset to Real Role
        </Button>
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 bg-muted/30 rounded-b-lg">
        <p className="text-[10px] text-muted-foreground text-center">
          Ctrl+Shift+D to toggle • Client-side preview only
        </p>
      </div>
    </div>
  );
}
