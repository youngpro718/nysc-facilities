
export const typeOptions = [
  { value: "all_types", label: "All types" },
  { value: "ACCESS_REQUEST", label: "Access Request" },
  { value: "BUILDING_SYSTEMS", label: "Building Systems" },
  { value: "CEILING", label: "Ceiling" },
  { value: "CLEANING_REQUEST", label: "Cleaning Request" },
  { value: "CLIMATE_CONTROL", label: "Climate Control" },
  { value: "DOOR", label: "Door" },
  { value: "ELECTRICAL_NEEDS", label: "Electrical Needs" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "EXTERIOR_FACADE", label: "Exterior/Facade" },
  { value: "FLAGPOLE_FLAG", label: "Flagpole/Flag" },
  { value: "FLOORING", label: "Flooring" },
  { value: "GENERAL_REQUESTS", label: "General Requests" },
  { value: "LEAK", label: "Leak" },
  { value: "LIGHTING", label: "Lighting" },
  { value: "LOCK", label: "Lock" },
  { value: "PLUMBING_NEEDS", label: "Plumbing Needs" },
  { value: "RESTROOM_REPAIR", label: "Restroom Repair" },
  { value: "SIGNAGE", label: "Signage" },
  { value: "WINDOW", label: "Window" }
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

// New lighting-specific filter options
export const lightingTypeOptions = [
  { value: "all_lighting_types", label: "All lighting types" },
  { value: "standard", label: "Standard" },
  { value: "emergency", label: "Emergency" },
  { value: "motion_sensor", label: "Motion Sensor" }
];

export const fixtureStatusOptions = [
  { value: "all_fixture_statuses", label: "All fixture statuses" },
  { value: "functional", label: "Functional" },
  { value: "maintenance_needed", label: "Needs Maintenance" },
  { value: "non_functional", label: "Non-functional" },
  { value: "pending_maintenance", label: "Pending Maintenance" },
  { value: "scheduled_replacement", label: "Scheduled for Replacement" }
];

export const electricalIssueOptions = [
  { value: "all_electrical_issues", label: "All electrical issues" },
  { value: "short_circuit", label: "Short Circuit" },
  { value: "wiring_issues", label: "Wiring Issues" },
  { value: "voltage_problems", label: "Voltage Problems" },
  { value: "ballast_issue", label: "Ballast Issue" }
];
