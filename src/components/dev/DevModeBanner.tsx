import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDevMode } from '@/hooks/useDevMode';
import { getRoleLabel, type UserRole } from '@/config/roles';

interface DevModeBannerProps {
  realRole: UserRole;
  previewRole: UserRole;
}

export function DevModeBanner({ realRole, previewRole }: DevModeBannerProps) {
  const { clearPreviewRole } = useDevMode();

  if (realRole === previewRole) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            Preview Mode: Viewing as <strong>{getRoleLabel(previewRole)}</strong>
          </span>
          <span className="text-xs text-amber-600/70 dark:text-amber-500/70 hidden sm:inline">
            (Your actual role: {getRoleLabel(realRole)})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-500/20"
          onClick={clearPreviewRole}
        >
          <X className="h-3 w-3 mr-1" />
          Exit Preview
        </Button>
      </div>
    </div>
  );
}
