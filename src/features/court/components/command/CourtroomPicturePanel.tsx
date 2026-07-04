/**
 * CourtroomPicturePanel — today's court operations at a glance: active
 * shutdowns first, then the parts sitting today with issue badges and
 * bunting flags. Weekend → "no parts sit today" note.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel, ChevronRight, Flag, AlertTriangle, Construction } from "lucide-react";
import { Link } from "react-router-dom";
import type { CourtroomPicture } from "@features/court/hooks/useCourtroomPicture";

export function CourtroomPicturePanel({
  picture,
  isLoading,
  error,
  getIssueCount,
  hasUrgent,
}: {
  picture: CourtroomPicture | undefined;
  isLoading: boolean;
  error: unknown;
  /** rooms.id → open issue count (from useCourtIssuesIntegration). */
  getIssueCount: (roomId: string) => number;
  hasUrgent: (roomId: string) => boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gavel className="h-4 w-4 text-primary" aria-hidden="true" />
          Courtroom Picture
          {picture && !picture.isWeekend && (
            <span className="text-xs font-normal text-muted-foreground">· {picture.today}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : error ? (
          <p className="py-4 text-sm text-muted-foreground">
            Couldn't load courtroom data — try refreshing.
          </p>
        ) : !picture?.hasTermData ? (
          <p className="py-4 text-sm text-muted-foreground">
            No term sheet data.{" "}
            <Link to="/term-sheet" className="underline">Open the Term Sheet</Link>
          </p>
        ) : (
          <>
            {picture.shutdowns.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2"
              >
                <Construction className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    Room {s.roomNumber} — {s.title || s.reason || "shutdown"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {s.status.replace("_", " ")}
                    {s.endDate ? ` · until ${s.endDate}` : ""}
                  </p>
                </div>
              </div>
            ))}
            {picture.isWeekend ? (
              <p className="py-4 text-sm text-muted-foreground">
                No parts sit today — next court day is Monday.
              </p>
            ) : picture.sittingToday.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No parts are scheduled to sit today.
              </p>
            ) : (
              picture.sittingToday.map((r) => {
                const issues = getIssueCount(r.roomId);
                return (
                  <div
                    key={r.assignmentId}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                      !r.isActive
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-border"
                    }`}
                  >
                    <span className="w-16 shrink-0 text-sm font-bold text-primary whitespace-pre-line">
                      {r.part}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{r.justice}</p>
                      <p className="text-xs text-muted-foreground">
                        Rm {r.roomNumber}
                        {r.sittingDays && ` · ${r.sittingDays}`}
                      </p>
                    </div>
                    {r.hasBunting && (
                      <Flag className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Bunting up" />
                    )}
                    {!r.isActive && (
                      <Badge variant="destructive" className="text-[10px] shrink-0">inactive</Badge>
                    )}
                    {issues > 0 && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 gap-0.5 ${
                          hasUrgent(r.roomId) ? "border-destructive text-destructive" : "border-orange-400 text-orange-500"
                        }`}
                      >
                        <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                        {issues}
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
        <Button asChild variant="ghost" size="sm" className="w-full mt-1 text-xs">
          <Link to="/courtrooms">
            Courtroom Directory <ChevronRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
