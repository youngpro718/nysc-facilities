import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

export function MobileKeyHeader() {
  const navigate = useNavigate();
  // useNotifications may or may not exist in this exact shape — fall back gracefully
  let unreadCount = 0;
  try {
    const notif = (useNotifications as unknown as () => { unreadCount?: number })?.();
    unreadCount = notif?.unreadCount ?? 0;
  } catch {
    unreadCount = 0;
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl font-bold leading-tight">Key Management</h1>
        <p className="text-sm text-muted-foreground">
          Find a key and know exactly where it is.
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="relative shrink-0 h-11 w-11"
        onClick={() => navigate("/notifications")}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 h-5 min-w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );
}
