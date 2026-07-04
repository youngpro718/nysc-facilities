/**
 * KeyAccountabilityPanel — every key currently out, who has it, and when
 * it's expected back. Overdue rows first (destructive highlight).
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyRound, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import type { ActiveKeyAssignment } from "@features/court/hooks/useKeyAccountability";

export function KeyAccountabilityPanel({
  assignments,
  isLoading,
  error,
}: {
  assignments: ActiveKeyAssignment[];
  isLoading: boolean;
  error: unknown;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
          Key Accountability
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
            Couldn't load key assignments — try refreshing.
          </p>
        ) : assignments.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">All keys returned.</p>
        ) : (
          assignments.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                a.overdue ? "border-destructive/40 bg-destructive/5" : "border-border"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {a.keyName}
                  {a.isSpare && (
                    <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0">spare</Badge>
                  )}
                  {a.isElevatorCard && (
                    <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0">elevator</Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {a.recipient} · out since {format(new Date(a.assignedAt), "MMM d")}
                </p>
              </div>
              {a.overdue ? (
                <Badge variant="destructive" className="text-[10px] shrink-0">
                  overdue {a.expectedReturnAt ? format(new Date(a.expectedReturnAt), "MMM d") : ""}
                </Badge>
              ) : a.expectedReturnAt ? (
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  due {format(new Date(a.expectedReturnAt), "MMM d")}
                </span>
              ) : null}
            </div>
          ))
        )}
        <Button asChild variant="ghost" size="sm" className="w-full mt-1 text-xs">
          <Link to="/keys">
            Key Management <ChevronRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
