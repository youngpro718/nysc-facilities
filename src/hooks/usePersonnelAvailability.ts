import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCourtPersonnel, PersonnelOption } from "@/hooks/useCourtPersonnel";
import { useStaffOutToday } from "@/hooks/useCourtOperationsRealtime";

export interface AssignmentInfo {
  roomId: string;
  roomNumber: string;
  part: string | null;
}

export interface PersonnelWithAvailability extends PersonnelOption {
  availability: 'available' | 'assigned' | 'absent';
  currentAssignments?: AssignmentInfo[];
  absenceReason?: string;
  absenceEndDate?: string;
}

export interface GroupedPersonnel {
  available: PersonnelWithAvailability[];
  assigned: PersonnelWithAvailability[];
  absent: PersonnelWithAvailability[];
}

export interface PersonnelAvailabilityData {
  judges: GroupedPersonnel;
  clerks: GroupedPersonnel;
  sergeants: GroupedPersonnel;
  all: GroupedPersonnel;
  isLoading: boolean;
}

const emptyGroup: GroupedPersonnel = { available: [], assigned: [], absent: [] };

export function usePersonnelAvailability(): PersonnelAvailabilityData {
  const { personnel, isLoading: personnelLoading } = useCourtPersonnel();
  const staffOut = useStaffOutToday();

  // Fetch current court assignments to know who's assigned where
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["court-assignments-availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_assignments")
        .select("room_id, room_number, part, justice, sergeant, clerks")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  // Fetch active absences for richer info (reason, end date)
  const { data: absences, isLoading: absencesLoading } = useQuery({
    queryKey: ["staff-absences-availability"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("staff_absences")
        .select("staff_id, absence_reason, ends_on, staff:staff_id(display_name)")
        .lte("starts_on", today)
        .gte("ends_on", today);
      if (error) throw error;
      return (data || []).map((row: any) => ({
        staff_id: row.staff_id as string,
        absence_reason: row.absence_reason as string,
        ends_on: row.ends_on as string,
        staff: Array.isArray(row.staff) ? row.staff[0] : row.staff,
      })) as Array<{
        staff_id: string;
        absence_reason: string;
        ends_on: string;
        staff: { display_name: string } | null;
      }>;
    },
    staleTime: 60_000,
  });

  const isLoading = personnelLoading || assignmentsLoading || absencesLoading;

  const result = useMemo(() => {
    if (!personnel || !assignments) {
      return { judges: emptyGroup, clerks: emptyGroup, sergeants: emptyGroup, all: emptyGroup, isLoading };
    }

    // Build lookup: staff name (lowercase) → assignment info[]
    const judgeAssignmentMap = new Map<string, AssignmentInfo[]>();
    const sergeantAssignmentMap = new Map<string, AssignmentInfo[]>();
    const clerkAssignmentMap = new Map<string, AssignmentInfo[]>();

    for (const a of assignments) {
      const info: AssignmentInfo = { roomId: a.room_id || "", roomNumber: a.room_number, part: a.part };

      if (a.justice?.trim()) {
        const key = a.justice.trim().toLowerCase();
        if (!judgeAssignmentMap.has(key)) judgeAssignmentMap.set(key, []);
        judgeAssignmentMap.get(key)!.push(info);
      }
      if (a.sergeant?.trim()) {
        const key = a.sergeant.trim().toLowerCase();
        if (!sergeantAssignmentMap.has(key)) sergeantAssignmentMap.set(key, []);
        sergeantAssignmentMap.get(key)!.push(info);
      }
      if (Array.isArray(a.clerks)) {
        for (const clerk of a.clerks) {
          if (clerk?.trim()) {
            const key = clerk.trim().toLowerCase();
            if (!clerkAssignmentMap.has(key)) clerkAssignmentMap.set(key, []);
            clerkAssignmentMap.get(key)!.push(info);
          }
        }
      }
    }

    // Build lookup: staff name (lowercase) → absence info
    const absenceMap = new Map<string, { reason: string; endDate: string }>();
    if (absences) {
      for (const a of absences) {
        const name = a.staff?.display_name?.trim().toLowerCase();
        if (name) {
          absenceMap.set(name, { reason: a.absence_reason, endDate: a.ends_on });
        }
      }
    }
    // Also use staffOut view for broader coverage
    const staffOutIds = new Set(staffOut.map((s) => s.staff_id));

    function annotate(
      list: PersonnelOption[],
      assignMap: Map<string, AssignmentInfo[]>
    ): GroupedPersonnel {
      const available: PersonnelWithAvailability[] = [];
      const assigned: PersonnelWithAvailability[] = [];
      const absent: PersonnelWithAvailability[] = [];

      for (const person of list) {
        const nameKey = person.name.trim().toLowerCase();
        const absInfo = absenceMap.get(nameKey);
        const isOutToday = absInfo || staffOutIds.has(person.id);
        const assignments = assignMap.get(nameKey);

        if (isOutToday) {
          absent.push({
            ...person,
            availability: "absent",
            absenceReason: absInfo?.reason || "Out today",
            absenceEndDate: absInfo?.endDate,
          });
        } else if (assignments && assignments.length > 0) {
          assigned.push({
            ...person,
            availability: "assigned",
            currentAssignments: assignments,
          });
        } else {
          available.push({ ...person, availability: "available" });
        }
      }

      return { available, assigned, absent };
    }

    const judges = annotate(personnel.judges, judgeAssignmentMap);
    const clerks = annotate(personnel.clerks, clerkAssignmentMap);
    const sergeants = annotate(personnel.sergeants, sergeantAssignmentMap);

    // Combine all for "all" role
    const allAssignmentMap = new Map<string, AssignmentInfo[]>();
    for (const [k, v] of judgeAssignmentMap) allAssignmentMap.set(k, v);
    for (const [k, v] of sergeantAssignmentMap) {
      const existing = allAssignmentMap.get(k) || [];
      allAssignmentMap.set(k, [...existing, ...v]);
    }
    for (const [k, v] of clerkAssignmentMap) {
      const existing = allAssignmentMap.get(k) || [];
      allAssignmentMap.set(k, [...existing, ...v]);
    }
    const all = annotate(personnel.allPersonnel, allAssignmentMap);

    return { judges, clerks, sergeants, all, isLoading };
  }, [personnel, assignments, absences, staffOut, isLoading]);

  return result;
}
