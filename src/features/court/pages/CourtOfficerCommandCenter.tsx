/**
 * Court Officer Command Center
 *
 * Command-level landing page for captains: key accountability on the left,
 * courtroom operational picture on the right. Read-only; the working tools
 * (Keys, Courtrooms, Reports, Term Sheet) are one click away.
 */
import { useAuth } from "@features/auth/hooks/useAuth";
import { useNotifications } from "@shared/hooks/useNotifications";
import { NotificationDropdown } from "@shared/components/user/NotificationDropdown";
import { useCourtIssuesIntegration } from "@features/court/hooks/useCourtIssuesIntegration";
import { useKeyAccountability } from "@features/court/hooks/useKeyAccountability";
import { useCourtroomPicture } from "@features/court/hooks/useCourtroomPicture";
import { CommandAlertsBar } from "@features/court/components/command/CommandAlertsBar";
import { CommandStats } from "@features/court/components/command/CommandStats";
import { KeyAccountabilityPanel } from "@features/court/components/command/KeyAccountabilityPanel";
import { CourtroomPicturePanel } from "@features/court/components/command/CourtroomPicturePanel";

export default function CourtOfficerCommandCenter() {
  const { user } = useAuth();
  const {
    notifications = [],
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications(user?.id);

  const keys = useKeyAccountability();
  const courtrooms = useCourtroomPicture();
  const { getIssuesForRoom, hasUrgentIssues } = useCourtIssuesIntegration();

  const assignments = keys.data ?? [];
  const overdueKeys = assignments.filter((a) => a.overdue).length;
  const picture = courtrooms.data;

  // Stat: rooms sitting today that have open issues. Alert: urgent issues in
  // ANY courtroom on the term (a fire in a room that sits tomorrow still
  // needs command attention today).
  const allRooms = [...(picture?.sittingToday ?? []), ...(picture?.notSittingToday ?? [])];
  const roomsWithIssues = (picture?.sittingToday ?? []).filter(
    (r) => getIssuesForRoom(r.roomId).length > 0,
  );
  const urgentCourtroomIssues = allRooms.filter((r) => hasUrgentIssues(r.roomId)).length;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6 pb-6 px-3 sm:px-0">
      {/* Header — Work Center pattern (operational surface, no first-name greeting) */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-medium text-primary">Court officer command</p>
          <h1 className="text-[length:var(--text-page-title)] font-semibold tracking-[-0.025em]">
            Command center
          </h1>
          <p className="mt-1 text-sm text-text-secondary tabular">
            {today} · Keys and courtroom readiness at a glance
          </p>
        </div>
        <NotificationDropdown
          notifications={notifications as any}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClearNotification={clearNotification}
          onClearAllNotifications={clearAllNotifications}
        />
      </div>

      <CommandAlertsBar overdueKeys={overdueKeys} urgentCourtroomIssues={urgentCourtroomIssues} />

      <CommandStats
        keysOut={assignments.length}
        overdueKeys={overdueKeys}
        courtroomsSittingToday={picture?.sittingToday.length ?? 0}
        courtroomsWithIssues={roomsWithIssues.length}
        isWeekend={picture?.isWeekend ?? false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
        <KeyAccountabilityPanel
          assignments={assignments}
          isLoading={keys.isLoading}
          error={keys.error}
        />
        <CourtroomPicturePanel
          picture={picture}
          isLoading={courtrooms.isLoading}
          error={courtrooms.error}
          getIssueCount={(roomId) => getIssuesForRoom(roomId).length}
          hasUrgent={hasUrgentIssues}
        />
      </div>
    </div>
  );
}
