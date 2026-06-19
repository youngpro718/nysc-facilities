import { supabase } from "@/lib/supabase";

export interface ChamberRoom {
  id: string;
  room_number: string;
  name: string;
}

export interface ChambersMovePerson {
  id: string;
  full_name: string | null;
  display_name: string | null;
  chambers_room_number: string | null;
}

export interface ChambersMoveLeg {
  id: string;
  personnel_id: string;
  from_room_id: string | null;
  to_room_id: string;
  sequence_order: number;
  person: ChambersMovePerson | null;
  from_room: ChamberRoom | null;
  to_room: ChamberRoom | null;
}

export interface ChambersMovePlan {
  id: string;
  title: string;
  effective_date: string;
  status: "scheduled" | "completed" | "cancelled";
  notes: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  legs: ChambersMoveLeg[];
  preparations: ChambersTransitionWorkItem[];
}

export interface CreateChambersMoveLegInput {
  personnel_id: string;
  from_room_id: string | null;
  to_room_id: string;
  sequence_order: number;
}

export type ChambersTransitionWorkType =
  | "painting"
  | "cleaning"
  | "electrical"
  | "construction"
  | "general"
  | "security_coverage";

export interface ChambersTransitionWorkItem {
  id: string;
  room_id: string;
  work_type: ChambersTransitionWorkType;
  title: string;
  scheduled_start_date: string;
  scheduled_end_date: string | null;
  requires_officer: boolean;
  notes: string | null;
  status: "scheduled" | "cancelled";
  room: ChamberRoom | null;
  maintenance_schedule: {
    id: string;
    status: string;
  } | null;
  staff_task: {
    id: string;
    status: string;
  } | null;
}

export interface CreateChambersTransitionWorkInput {
  room_id: string;
  work_type: ChambersTransitionWorkType;
  title: string;
  scheduled_start_date: string;
  scheduled_end_date: string | null;
  requires_officer: boolean;
  notes?: string;
}

export async function listChamberRooms(): Promise<ChamberRoom[]> {
  const { data, error } = await supabase
    .from("rooms")
    .select("id, room_number, name")
    .in("room_type", ["chamber", "judges_chambers"])
    .eq("status", "active")
    .order("room_number");

  if (error) throw error;
  return (data || []) as ChamberRoom[];
}

export async function listChambersMovePlans(): Promise<ChambersMovePlan[]> {
  const { data, error } = await supabase
    .from("chambers_move_plans")
    .select(`
      id,
      title,
      effective_date,
      status,
      notes,
      completed_at,
      cancelled_at,
      cancellation_reason,
      created_at,
      legs:chambers_move_legs(
        id,
        personnel_id,
        from_room_id,
        to_room_id,
        sequence_order,
        person:personnel_profiles!chambers_move_legs_personnel_id_fkey(
          id,
          full_name,
          display_name,
          chambers_room_number
        ),
        from_room:rooms!chambers_move_legs_from_room_id_fkey(
          id,
          room_number,
          name
        ),
        to_room:rooms!chambers_move_legs_to_room_id_fkey(
          id,
          room_number,
          name
        )
      ),
      preparations:chambers_transition_work_items(
        id,
        room_id,
        work_type,
        title,
        scheduled_start_date,
        scheduled_end_date,
        requires_officer,
        notes,
        status,
        room:rooms!chambers_transition_work_items_room_id_fkey(
          id,
          room_number,
          name
        ),
        maintenance_schedule:maintenance_schedules!chambers_transition_work_items_maintenance_schedule_id_fkey(
          id,
          status
        ),
        staff_task:staff_tasks!chambers_transition_work_items_staff_task_id_fkey(
          id,
          status
        )
      )
    `)
    .order("effective_date", { ascending: false });

  if (error) throw error;

  return ((data || []) as unknown as ChambersMovePlan[]).map((plan) => ({
    ...plan,
    legs: [...(plan.legs || [])].sort(
      (a, b) => a.sequence_order - b.sequence_order,
    ),
    preparations: [...(plan.preparations || [])].sort(
      (a, b) =>
        new Date(a.scheduled_start_date).getTime() -
        new Date(b.scheduled_start_date).getTime(),
    ),
  }));
}

export async function createChambersTransition(input: {
  title: string;
  effectiveDate: string;
  notes?: string;
  legs: CreateChambersMoveLegInput[];
  workItems: CreateChambersTransitionWorkInput[];
}): Promise<{
  plan_id: string;
  maintenance_schedules_created: number;
  coverage_tasks_created: number;
}> {
  const { data, error } = await supabase.rpc("create_chambers_transition", {
    p_title: input.title,
    p_effective_date: input.effectiveDate,
    p_notes: input.notes || null,
    p_legs: input.legs,
    p_work_items: input.workItems,
  });

  if (error) throw error;
  return data as {
    plan_id: string;
    maintenance_schedules_created: number;
    coverage_tasks_created: number;
  };
}

export async function createChambersMovePlan(input: {
  title: string;
  effectiveDate: string;
  notes?: string;
  legs: CreateChambersMoveLegInput[];
}): Promise<string> {
  const { data, error } = await supabase.rpc("create_chambers_move_plan", {
    p_title: input.title,
    p_effective_date: input.effectiveDate,
    p_notes: input.notes || null,
    p_legs: input.legs,
  });

  if (error) throw error;
  return data as string;
}

export async function completeChambersMovePlan(planId: string): Promise<void> {
  const { error } = await supabase.rpc("complete_chambers_move_plan", {
    p_plan_id: planId,
    p_force: false,
  });
  if (error) throw error;
}

export async function updateChambersMovePlan(
  planId: string,
  input: {
    title: string;
    effectiveDate: string;
    notes?: string;
    legs: CreateChambersMoveLegInput[];
  },
): Promise<void> {
  const { error } = await supabase.rpc("update_chambers_move_plan", {
    p_plan_id: planId,
    p_title: input.title,
    p_effective_date: input.effectiveDate,
    p_notes: input.notes || null,
    p_legs: input.legs,
  });
  if (error) throw error;
}

export async function cancelChambersMovePlan(planId: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_chambers_move_plan", {
    p_plan_id: planId,
    p_reason: "Cancelled from Court Operations",
  });
  if (error) throw error;
}
