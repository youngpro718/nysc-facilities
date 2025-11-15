
// Define filter options for lighting issues
export const lightingTypeOptions = [
  { value: "standard", label: "Standard" },
  { value: "emergency", label: "Emergency" },
  { value: "exit_sign", label: "Exit Sign" },
  { value: "decorative", label: "Decorative" },
  { value: "motion_sensor", label: "Motion Sensor" }
];

export const fixtureStatusOptions = [
  { value: "functional", label: "Functional" },
  { value: "maintenance_needed", label: "Needs Maintenance" },
  { value: "non_functional", label: "Non-functional" },
  { value: "pending_maintenance", label: "Pending Maintenance" },
  { value: "scheduled_replacement", label: "Scheduled Replacement" }
];

export const electricalIssueOptions = [
  { value: "short_circuit", label: "Short Circuit" },
  { value: "wiring_issues", label: "Wiring Issues" },
  { value: "voltage_problems", label: "Voltage Problems" },
  { value: "none", label: "No Issues" }
];

// Define filter options for other issue types
export const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" }
];

export const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" }
];

export const assigneeTypeOptions = [
  { value: "unassigned", label: "Unassigned" },
  { value: "maintenance", label: "Maintenance" },
  { value: "facilities", label: "Facilities" },
  { value: "it", label: "IT" },
  { value: "security", label: "Security" }
];

// Add the missing exports
export const typeOptions = [
  { value: "all_types", label: "All Types" },
  { value: "ACCESS_REQUEST", label: "Access Request" },
  { value: "BUILDING_SYSTEMS", label: "Building Systems" },
  { value: "CEILING", label: "Ceiling" },
  { value: "CLEANING_REQUEST", label: "Cleaning Request" },
  { value: "CLIMATE_CONTROL", label: "Climate Control" },
  { value: "DOOR", label: "Door" },
  { value: "ELECTRICAL_NEEDS", label: "Electrical Needs" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "EXTERIOR_FACADE", label: "Exterior Facade" },
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

// Alias for backward compatibility - using the same as assigneeTypeOptions
export const assignmentOptions = assigneeTypeOptions;

// Sort and grouping options
export const sortOptions = [
  { value: "created_at-desc", label: "Newest first" },
  { value: "created_at-asc", label: "Oldest first" },
  { value: "priority-desc", label: "Highest priority" },
  { value: "priority-asc", label: "Lowest priority" },
  { value: "status-asc", label: "Status (A-Z)" },
  { value: "status-desc", label: "Status (Z-A)" },
  { value: "title-asc", label: "Title (A-Z)" },
  { value: "title-desc", label: "Title (Z-A)" }
];

export const groupingOptions = [
  { value: "none", label: "No grouping" },
  { value: "status", label: "By status" },
  { value: "priority", label: "By priority" },
  { value: "type", label: "By type" },
  { value: "assigned_to", label: "By assignment" }
];
