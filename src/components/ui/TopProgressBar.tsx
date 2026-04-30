/**
 * TopProgressBar - YouTube/GitHub-style top progress bar.
 *
 * Animates whenever React Query has any in-flight fetches OR a route
 * transition is happening. Greatly improves perceived performance by
 * giving the user immediate visual feedback that something is loading.
 */

import { useEffect, useRef, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function TopProgressBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = fetching > 0 || mutating > 0;

  // Trigger a quick burst on every route change so the user sees instant feedback.
  useEffect(() => {
    setVisible(true);
    setProgress(15);
    const t1 = setTimeout(() => setProgress(45), 100);
    const t2 = setTimeout(() => setProgress(70), 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    if (active) {
      setVisible(true);
      setProgress((p) => (p < 30 ? 30 : p < 80 ? p + 5 : p));
      timer.current = setInterval(() => {
        setProgress((p) => (p < 85 ? p + Math.max(1, (90 - p) / 12) : p));
      }, 200) as unknown as ReturnType<typeof setTimeout>;
    } else {
      setProgress(100);
      timer.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [active]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-primary to-primary/70 shadow-[0_0_8px_hsl(var(--primary)/0.6)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
