/**
 * OnboardingHintStrip — first-time-user hint cards on the standard dashboard.
 *
 * Three small cards that explain the primary actions in plain language.
 * Dismissible per-user via localStorage so it never re-appears once closed.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Send, Activity, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefetchRoute } from '@/lib/prefetchRoutes';

const STORAGE_KEY = 'nysc_onboarding_hints_dismissed_v1';

interface Hint {
  icon: React.ElementType;
  title: string;
  body: string;
  to: string;
  accent: string;
}

const HINTS: Hint[] = [
  {
    icon: Package,
    title: 'Order Supplies',
    body: 'Need pens, paper, or a stapler? Tap Order Supplies and pick from the catalog.',
    to: '/request/supplies',
    accent: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  },
  {
    icon: Send,
    title: 'Report an Issue',
    body: 'Broken light, leak, or anything else? Report it and we will route it to the right team.',
    to: '/request/help',
    accent: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  },
  {
    icon: Activity,
    title: 'Track Your Requests',
    body: 'See live status updates for every supply order, key request, and issue you submit.',
    to: '/my-activity',
    accent: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
];

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function OnboardingHintStrip() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed());

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <section
      aria-label="Getting started"
      className="relative rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background p-4 animate-fade-in"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Welcome — here's what you can do</h2>
        <button
          onClick={dismiss}
          aria-label="Dismiss getting-started hints"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {HINTS.map((h) => {
          const Icon = h.icon;
          return (
            <button
              key={h.title}
              onClick={() => navigate(h.to)}
              onPointerEnter={() => prefetchRoute(h.to)}
              onFocus={() => prefetchRoute(h.to)}
              className="group flex flex-col gap-1.5 text-left rounded-lg border border-border/60 bg-card p-3 hover:border-primary/40 hover:shadow-sm transition-all min-h-[88px]"
            >
              <span className={cn('inline-flex items-center justify-center h-7 w-7 rounded-md border', h.accent)}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-foreground leading-tight">{h.title}</span>
              <span className="text-xs text-muted-foreground leading-snug">{h.body}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
