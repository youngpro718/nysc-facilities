/**
 * TopProgressBar - YouTube/GitHub-style top progress bar.
 *
 * Animates whenever React Query has any in-flight fetches OR a route
 * transition is happening. Greatly improves perceived performance by
 * giving the user immediate visual feedback that something is loading.
 *
 * Behavior contract:
 * - On route change: instantly show + jump to ~25%, then trickle.
 * - While any fetch/mutation in flight: trickle toward 90% (never reaches 100).
 * - When all activity ends: snap to 100%, fade out, reset to 0.
 * - Rapid route changes: do NOT regress progress; reset baseline only if hidden.
 * - Long-running requests: trickle slows asymptotically, never hides early.
 * - Safety net: if visible for more than 30s with no activity, force-hide.
 */

import { useEffect, useRef, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TRICKLE_MS = 250;
const HIDE_DELAY_MS = 250;
const SAFETY_TIMEOUT_MS = 30_000;

export function TopProgressBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const location = useLocation();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether the bar has ever been shown. The "active=false" branch
  // must not run on the very first render (we have nothing to finish), or
  // it would set progress to 100 just before the trickle takes over.
  const shownRef = useRef(false);

  const active = fetching > 0 || mutating > 0;

  const clearTrickle = () => {
    if (trickleRef.current) {
      clearInterval(trickleRef.current);
      trickleRef.current = null;
    }
  };
  const clearHide = () => {
    if (hideRef.current) {
      clearTimeout(hideRef.current);
      hideRef.current = null;
    }
  };
  const clearSafety = () => {
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
  };

  const startTrickle = () => {
    clearTrickle();
    trickleRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p; // cap; never auto-reach 100
        // Slows as we approach 90 — keeps long requests visually alive
        const step = Math.max(0.5, (90 - p) / 18);
        return Math.min(90, p + step);
      });
    }, TRICKLE_MS);
  };

  const armSafety = () => {
    clearSafety();
    safetyRef.current = setTimeout(() => {
      // Force-hide if something got stuck visible
      clearTrickle();
      setProgress(100);
      hideRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, HIDE_DELAY_MS);
    }, SAFETY_TIMEOUT_MS);
  };

  // Route change: instant feedback, never regress
  useEffect(() => {
    clearHide();
    setVisible(true);
    shownRef.current = true;
    // Jump forward only, but always clamp under the trickle ceiling so the
    // bar can never display 100% while we're still in a "loading" state.
    setProgress((p) => Math.min(90, Math.max(p, 25)));
    startTrickle();
    armSafety();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Activity transitions
  useEffect(() => {
    if (active) {
      clearHide();
      setVisible(true);
      shownRef.current = true;
      // Same clamp as above — entering an active state must never show 100%.
      setProgress((p) => Math.min(90, Math.max(p, 25)));
      startTrickle();
      armSafety();
    } else {
      // Skip the "finish + hide" branch on the very first render; we haven't
      // shown anything yet, so there is nothing to finish.
      if (!shownRef.current) return;
      // No activity — finish and hide
      clearTrickle();
      clearSafety();
      setProgress(100);
      clearHide();
      hideRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
        shownRef.current = false;
      }, HIDE_DELAY_MS);
    }
  }, [active]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      clearTrickle();
      clearHide();
      clearSafety();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-testid="top-progress-bar"
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
