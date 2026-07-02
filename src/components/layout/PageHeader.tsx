import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Kept for API compatibility; the slim header no longer renders an icon box. */
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Unified page header used across the app.
 *
 * Deliberately slim: one row with the title, an inline muted description
 * (wide screens only), and page actions on the right. The app chrome already
 * names the page in the top bar and the breadcrumb names its parents, so a
 * tall hero block here would be the third title on screen.
 */
export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 mb-4 min-h-9",
        className,
      )}
    >
      <div className="flex items-baseline gap-2.5 min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate shrink-0">
          {title}
        </h1>
        {description && (
          <p className="hidden lg:block text-sm text-muted-foreground truncate min-w-0">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
