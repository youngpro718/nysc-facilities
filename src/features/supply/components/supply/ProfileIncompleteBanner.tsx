import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useProfileCompleteness } from '@features/supply/hooks/useProfileCompleteness';

/**
 * Inline banner shown on the supply ordering surfaces when the signed-in user
 * is missing key profile fields (department, home room). Routes them to the
 * profile page to fix it once so subsequent orders auto-fill correctly.
 */
export function ProfileIncompleteBanner({ className }: { className?: string }) {
  const { user } = useAuth();
  const { isLoading, isComplete, missing } = useProfileCompleteness(user?.id);

  if (isLoading || isComplete) return null;

  const list =
    missing.length === 1
      ? missing[0]
      : missing.length === 2
        ? `${missing[0]} and ${missing[1]}`
        : `${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]}`;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border border-amber-500/40 bg-amber-500/5 ${className || ''}`}
      role="alert"
    >
      <div className="flex gap-2 flex-1 min-w-0">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm min-w-0">
          <p className="font-medium text-amber-700 dark:text-amber-400">
            Finish your profile so orders reach you
          </p>
          <p className="text-amber-700/80 dark:text-amber-400/80 mt-0.5">
            We're missing {list}. Without these, supply staff may not know where
            to deliver your order.
          </p>
        </div>
      </div>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 shrink-0"
      >
        <Link to="/profile">Update profile</Link>
      </Button>
    </div>
  );
}
