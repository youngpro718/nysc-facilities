/**
 * useKeyAccountability — every active (unreturned) key assignment, overdue
 * first. Read-only; feeds the command dashboard's key panel and alert bar.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { isOverdueAssignment } from "@features/court/utils/commandLogic";

export interface ActiveKeyAssignment {
  id: string;
  keyName: string;
  recipient: string;
  assignedAt: string;
  expectedReturnAt: string | null;
  isSpare: boolean;
  isElevatorCard: boolean;
  overdue: boolean;
}

export function useKeyAccountability() {
  return useQuery({
    queryKey: ["command-key-accountability"],
    queryFn: async (): Promise<ActiveKeyAssignment[]> => {
      const { data, error } = await supabase
        .from("key_assignments")
        .select(
          "id, assigned_at, returned_at, expected_return_at, is_spare, is_elevator_card, recipient_name, keys:key_id(name)",
        )
        .is("returned_at", null)
        .order("assigned_at", { ascending: false });
      if (error) throw error;

      const rows = (data || []).map((a: any): ActiveKeyAssignment => ({
        id: a.id,
        keyName: a.keys?.name || "Unnamed key",
        recipient: a.recipient_name || "—",
        assignedAt: a.assigned_at,
        expectedReturnAt: a.expected_return_at,
        isSpare: !!a.is_spare,
        isElevatorCard: !!a.is_elevator_card,
        overdue: isOverdueAssignment(a),
      }));

      // Overdue first; then soonest expected return; dateless issuances last.
      return rows.sort((x, y) => {
        if (x.overdue !== y.overdue) return x.overdue ? -1 : 1;
        if (x.expectedReturnAt && y.expectedReturnAt)
          return x.expectedReturnAt < y.expectedReturnAt ? -1 : 1;
        if (x.expectedReturnAt !== y.expectedReturnAt) return x.expectedReturnAt ? -1 : 1;
        return x.assignedAt < y.assignedAt ? 1 : -1;
      });
    },
    staleTime: 30_000,
  });
}
