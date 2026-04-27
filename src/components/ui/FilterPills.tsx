import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FilterPillOption<T extends string> {
  label: string;
  value: T;
  /** Optional leading visual (icon, status dot, badge, etc.) */
  adornment?: ReactNode;
}

interface FilterPillsProps<T extends string> {
  options: FilterPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Optional label displayed before the pills */
  label?: string;
  className?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
}

/**
 * Reusable pill-style filter row.
 *
 * Replaces ad-hoc `flex flex-wrap` button groups so filter bars
 * (Tasks, BuildingFilterBar, etc.) share consistent shape, spacing,
 * and selected-state styling.
 */
export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  size = "md",
  ariaLabel,
}: FilterPillsProps<T>) {
  const pad = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel ?? label}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {label && (
        <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
          {label}
        </span>
      )}
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className={cn(
              "shrink-0 rounded-full font-medium transition-colors border inline-flex items-center gap-1.5 touch-manipulation",
              pad,
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            )}
          >
            {opt.adornment}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
