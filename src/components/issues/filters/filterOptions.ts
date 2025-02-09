
export const typeOptions = [
  { value: "all_types", label: "All types" },
  { value: "HVAC", label: "HVAC" },
  { value: "Leak", label: "Leak" },
  { value: "Electrical", label: "Electrical" },
  { value: "Plaster", label: "Plaster" },
  { value: "Cleaning", label: "Cleaning" },
  { value: "Lighting_Ballast", label: "Lighting Ballast" },
  { value: "Lighting_Replacement", label: "Lighting Replacement" },
  { value: "Lighting_Emergency", label: "Emergency Lighting" },
  { value: "Lighting_Sensor", label: "Lighting Sensor" },
  { value: "Other", label: "Other" }
];

export const statusOptions = [
  { value: "all_statuses", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" }
];

export const priorityOptions = [
  { value: "all_priorities", label: "All priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" }
];

export const assignmentOptions = [
  { value: "all_assignments", label: "All assignments" },
  { value: "DCAS", label: "DCAS" },
  { value: "OCA", label: "OCA" },
  { value: "Self", label: "Self" },
  { value: "Outside_Vendor", label: "Outside Vendor" }
];

export const sortOptions = [
  { value: "created_at-desc", label: "Newest first" },
  { value: "created_at-asc", label: "Oldest first" },
  { value: "due_date-asc", label: "Due date (earliest)" },
  { value: "due_date-desc", label: "Due date (latest)" },
  { value: "priority-desc", label: "Priority (high to low)" },
  { value: "priority-asc", label: "Priority (low to high)" }
];

export const groupingOptions = [
  { value: "none", label: "No grouping" },
  { value: "building", label: "By Building" },
  { value: "floor", label: "By Floor" }
];
