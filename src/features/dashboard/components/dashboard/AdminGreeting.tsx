/**
 * Corporate portfolio header for the administrative dashboard.
 */

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface AdminGreetingProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function AdminGreeting({ onRefresh, isLoading }: AdminGreetingProps) {
  const formattedDate = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
      <div>
        <p className="mb-1 text-xs font-medium text-primary">Facilities portfolio</p>
        <h1 className="text-[length:var(--text-page-title)] font-semibold tracking-[-0.025em]">
          Administrative overview
        </h1>
        <p className="mt-1 text-sm text-text-secondary tabular">
          {formattedDate} · Live operational status by building
        </p>
      </div>
      {onRefresh && (
        <Button variant="outline" onClick={onRefresh} disabled={isLoading} size="sm" className="h-9 bg-card">
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh data
        </Button>
      )}
    </div>
  );
}
