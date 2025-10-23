// Session Status Constants

export const SESSION_STATUSES = [
  { value: 'CALENDAR', label: 'Calendar', description: 'Calendar call' },
  { value: 'HRG', label: 'Hearing', description: 'Hearing in session' },
  { value: 'PC_CONTD', label: 'PC Continued', description: 'People continued' },
  { value: 'JD_CONTD', label: 'JD Continued', description: 'Judge continued' },
  { value: 'BT', label: 'Bench Trial', description: 'Bench trial' },
  { value: 'BT_PC', label: 'BT - PC', description: 'Bench trial - People continued' },
  { value: 'TR', label: 'Trial', description: 'Jury trial' },
  { value: 'ADJ', label: 'Adjourned', description: 'Adjourned' },
  { value: 'DARK', label: 'Dark', description: 'Court not in session' },
] as const;

export type SessionStatus = typeof SESSION_STATUSES[number]['value'];

export const BUILDING_CODES = [
  { value: '100', label: '100 Centre Street' },
  { value: '111', label: '111 Centre Street' },
] as const;

export const SESSION_PERIODS = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
  { value: 'ALL_DAY', label: 'All Day' },
] as const;
