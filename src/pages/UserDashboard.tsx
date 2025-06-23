import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCard } from "@/components/dashboard/NotificationCard";
import { RoomAssignmentCard } from "@/components/dashboard/RoomAssignmentCard";
import { KeyAssignmentCard } from "@/components/dashboard/KeyAssignmentCard";
import { IssueSummaryCard } from "@/components/dashboard/IssueSummaryCard";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: notifications = [], isLoading: notificationsLoading } = useNotifications();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome, {user.first_name} {user.last_name}!
        </h2>
        <p className="text-muted-foreground">
          Here's what's happening in your organization today.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <NotificationCard 
          notifications={notifications} 
          onMarkAsRead={() => {}} 
          onMarkAllAsRead={() => {}} 
        />
        <RoomAssignmentCard userId={user.id} />
        <KeyAssignmentCard userId={user.id} />
        <IssueSummaryCard userId={user.id} />
      </div>
    </div>
  );
}
