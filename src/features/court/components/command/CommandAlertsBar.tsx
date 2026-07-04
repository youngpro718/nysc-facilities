/**
 * CommandAlertsBar — renders only when something needs command attention:
 * overdue keys or courtrooms with urgent open issues. Zero alerts → null.
 */
import { AlertTriangle, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CommandAlertsBar({
  overdueKeys,
  urgentCourtroomIssues,
}: {
  overdueKeys: number;
  urgentCourtroomIssues: number;
}) {
  const navigate = useNavigate();
  if (overdueKeys === 0 && urgentCourtroomIssues === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" aria-hidden="true" />
      <span className="text-sm font-medium text-destructive">Needs attention:</span>
      {overdueKeys > 0 && (
        <button
          onClick={() => navigate("/keys")}
          className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive hover:bg-destructive/25 transition-colors"
        >
          <KeyRound className="h-3 w-3" aria-hidden="true" />
          {overdueKeys} overdue key{overdueKeys !== 1 ? "s" : ""}
        </button>
      )}
      {urgentCourtroomIssues > 0 && (
        <button
          onClick={() => navigate("/operations?tab=issues")}
          className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive hover:bg-destructive/25 transition-colors"
        >
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          {urgentCourtroomIssues} urgent courtroom issue{urgentCourtroomIssues !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}
