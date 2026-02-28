/**
 * AdminGreeting — Personalized time-aware greeting for the admin dashboard
 */

import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface AdminGreetingProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function AdminGreeting({ onRefresh, isLoading }: AdminGreetingProps) {
  const { profile, user } = useAuth();

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const firstName =
    (profile as any)?.first_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "Admin";

  const formattedDate = format(now, "EEEE, MMMM d, yyyy");

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-[length:var(--text-page-title)] font-bold tracking-tight">
          {greeting}, {firstName}.
        </h1>
        <p className="text-sm text-text-secondary">{formattedDate}</p>
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
