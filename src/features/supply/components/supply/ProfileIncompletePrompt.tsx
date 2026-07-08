import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useProfileCompleteness } from '@features/supply/hooks/useProfileCompleteness';

/**
 * Auto-opens once per browser session when the signed-in user hits the
 * supplies page without a home room / department / name on file. The primary
 * ask is choosing a room — the rest is called out as "more to fill out".
 */
export function ProfileIncompletePrompt() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLoading, isComplete, hasHomeRoom, hasDepartment, hasName } =
    useProfileCompleteness(user?.id);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isLoading || isComplete || !user?.id) return;
    const key = `supply-profile-prompt-shown:${user.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    setOpen(true);
  }, [isLoading, isComplete, user?.id]);

  if (isComplete) return null;

  const primaryMsg = !hasHomeRoom
    ? 'Please choose a room to complete your profile.'
    : !hasDepartment
      ? 'Please add your department or part to complete your profile.'
      : !hasName
        ? 'Please add your name to complete your profile.'
        : 'Please finish your profile.';

  const extras: string[] = [];
  if (hasHomeRoom && !hasDepartment) extras.push('department / part');
  if (hasHomeRoom && !hasName) extras.push('your name');
  if (!hasHomeRoom && !hasDepartment) extras.push('department / part');
  if (!hasHomeRoom && !hasName) extras.push('your name');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Finish your profile
          </DialogTitle>
          <DialogDescription className="text-sm pt-1">
            {primaryMsg}
            {extras.length > 0 && (
              <span className="block mt-2 text-xs text-muted-foreground">
                There's a bit more to fill out too ({extras.join(', ')}), but the
                room is the main thing supply staff need.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Not now
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              navigate('/profile?tab=profile');
            }}
          >
            Update profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
