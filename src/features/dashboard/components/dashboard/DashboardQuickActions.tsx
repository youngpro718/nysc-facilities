/**
 * DashboardQuickActions — the standard user's three primary actions as a
 * responsive card row. Desktop: three upright cards side by side. Mobile:
 * stacked full-width rows (same as the old ActionRow look).
 */
import React from "react";
import { ChevronRight } from "lucide-react";

export interface QuickActionItem {
  icon: React.ElementType;
  label: string;
  sub?: string;
  onClick: () => void;
  /** Highlighted primary action (solid brand background). */
  accent?: boolean;
  /** Route chunk to prefetch on hover/focus. */
  prefetchPath?: string;
}

export function DashboardQuickActions({ actions }: { actions: QuickActionItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-tour="quick-actions">
      {actions.map((a) => (
        <QuickActionCard key={a.label} {...a} />
      ))}
    </div>
  );
}

function QuickActionCard({ icon: Icon, label, sub, onClick, accent, prefetchPath }: QuickActionItem) {
  const handlePrefetch = () => {
    if (prefetchPath) {
      // Lazy import so the test setup mock for react-query isn't needed here.
      import("@/lib/prefetchRoutes").then((m) => m.prefetchRoute(prefetchPath));
    }
  };
  return (
    <button
      onClick={onClick}
      onPointerEnter={handlePrefetch}
      onFocus={handlePrefetch}
      className={`flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3 rounded-md px-5 py-4 sm:py-5 text-left transition-colors touch-manipulation
        ${accent
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-card border border-border hover:bg-accent text-foreground"
        }`}
    >
      <Icon className="h-6 w-6 shrink-0" />
      <div className="flex-1 min-w-0 sm:flex-none">
        <span className="text-base font-medium">{label}</span>
        <p className={`text-xs mt-0.5 ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {/* Non-breaking space keeps card heights equal when there is no sub */}
          {sub ?? " "}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 opacity-50 sm:hidden" />
    </button>
  );
}
