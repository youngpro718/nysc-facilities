import { supabase } from "@/lib/supabase";

export type KeyPersonnelRole = "judge" | "sergeant" | "clerk" | "officer";

export interface KeyPersonnelRow {
  id: string;
  display_name: string | null;
  full_name: string | null;
  primary_role: string | null;
  title: string | null;
  department: string | null;
  is_active: boolean | null;
  court_attorney: string | null;
  chambers_room_number: string | null;
}

export interface SaveKeyPersonnelInput {
  first_name: string;
  last_name: string;
  display_name: string;
  primary_role: KeyPersonnelRole;
  title: string;
  department: string | null;
  chambers_room_number: string | null;
  court_attorney: string | null;
  is_active: boolean;
  is_available_for_assignment: boolean;
  judge_status?: "active";
}

export async function listKeyPersonnel(): Promise<KeyPersonnelRow[]> {
  const { data, error } = await supabase.rpc("list_personnel_profiles_minimal");
  if (error) throw error;
  return ((data || []) as KeyPersonnelRow[]).sort((a, b) =>
    (a.full_name || a.display_name || "").localeCompare(
      b.full_name || b.display_name || "",
    ),
  );
}

export async function saveKeyPersonnel(
  input: SaveKeyPersonnelInput,
  personnelId?: string,
): Promise<"added" | "updated"> {
  if (personnelId) {
    const { error } = await supabase
      .from("personnel_profiles")
      .update(input)
      .eq("id", personnelId);
    if (error) throw error;
    return "updated";
  }

  const { error } = await supabase.from("personnel_profiles").insert(input);
  if (error) throw error;
  return "added";
}
