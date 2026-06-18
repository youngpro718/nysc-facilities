/**
 * AdminGreeting — Formal administrative dashboard header.
 *
 * Was a personalized "Good afternoon, Jack." time-aware greeting; that's
 * consumer-SaaS energy. Replaced with a formal page title + the full date
 * (court convention: every record carries today's date prominently).
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
    <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-[length:var(--text-page-title)] font-semibold tracking-tight">
          Administrative Dashboard
        </h1>
        <p className="text-sm text-text-secondary tabular">{formattedDate}</p>
      </div>
      {onRefresh && (
        <Button variant="outline" onClick={onRefresh} disabled={isLoading} size="sm">
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      )}
    </div>
  );
}
