import { NotificationBox } from "@/components/admin/NotificationBox";

export default function Notifications() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage system notifications and alerts
        </p>
      </div>

      <NotificationBox />
    </div>
  );
}