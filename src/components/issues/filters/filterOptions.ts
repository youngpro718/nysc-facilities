
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
