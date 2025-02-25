
export interface FormValues {
  original_room_id: string;
  temporary_room_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  relocation_type: "emergency" | "maintenance" | "other" | "construction";
  special_instructions?: string;
}

