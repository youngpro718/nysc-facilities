import { useMemo } from "react";
import { useCourtIssuesIntegration, type CourtIssue } from "@features/court/hooks/useCourtIssuesIntegration";
import { useSpaceFixtures } from "@features/lighting/hooks/useLightingData";
import { differenceInDays } from "date-fns";

export type RoomHealthLevel = "good" | "attention" | "critical";

export interface RoomHealth {
  level: RoomHealthLevel;
  openCount: number;
  urgentCount: number;
  prolongedCount: number;
  oldestProlongedDays: number;
  latestIssue?: CourtIssue;
  latestIssueDaysAgo?: number;
  prolongedIssues: CourtIssue[];
  fixturesOutCount: number;
}

const PROLONGED_DAYS = 7;

const isUrgent = (priority?: string) =>
  ["urgent", "high", "critical"].includes((priority || "").toLowerCase());

export function useRoomHealth(roomId: string): RoomHealth {
  const { getIssuesForRoom } = useCourtIssuesIntegration();
  const openIssues = getIssuesForRoom(roomId);
  const { data: fixtures = [] } = useSpaceFixtures(roomId, "room");

  return useMemo(() => {
    const now = new Date();
    const withAges = openIssues.map((i) => ({
      issue: i,
      ageDays: differenceInDays(now, new Date(i.created_at)),
    }));

    const prolonged = withAges.filter((x) => x.ageDays >= PROLONGED_DAYS);
    const urgentCount = openIssues.filter((i) => isUrgent(i.priority)).length;
    const oldestProlongedDays = prolonged.reduce(
      (max, x) => Math.max(max, x.ageDays),
      0
    );
    const latest = [...openIssues].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    const outFixtures = fixtures.filter((f) => f.status && f.status !== "functional");
    const fixturesOutCount = outFixtures.length;
    const fixturesUrgentCount = outFixtures.filter(
      (f) => f.requires_electrician || f.emergency_circuit
    ).length;

    const openCount = openIssues.length + fixturesOutCount;
    const combinedUrgentCount = urgentCount + fixturesUrgentCount;

    let level: RoomHealthLevel = "good";
    if (combinedUrgentCount > 0 || prolonged.length >= 2) level = "critical";
    else if (openCount > 0 || prolonged.length === 1) level = "attention";

    return {
      level,
      openCount,
      urgentCount: combinedUrgentCount,
      prolongedCount: prolonged.length,
      oldestProlongedDays,
      latestIssue: latest,
      latestIssueDaysAgo: latest
        ? differenceInDays(now, new Date(latest.created_at))
        : undefined,
      prolongedIssues: prolonged.map((x) => x.issue),
      fixturesOutCount,
    };
  }, [openIssues, fixtures]);
}
