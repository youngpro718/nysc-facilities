/**
 * Court Operations Type Definitions
 * 
 * This file provides type definitions and documentation for court operations data.
 * 
 * ## Room ID Naming Convention
 * 
 * The codebase uses two different ID fields for rooms:
 * 
 * - **court_room_id**: References `court_rooms.id` - The court room record with
 *   court-specific metadata (judge capacity, specialization, etc.)
 * 
 * - **room_id**: References `rooms.id` - The base room record with general
 *   room information (floor, building, dimensions, etc.)
 * 
 * The `court_rooms` table has a `room_id` foreign key linking to `rooms`.
 * 
 * When working with court sessions or assignments:
 * - Use `court_room_id` to reference the court room
 * - Access `court_rooms.room_id` if you need the base room
 * 
 * ## Table Relationships
 * 
 * ```
 * court_sessions
 *   └── court_room_id → court_rooms.id
 *                           └── room_id → rooms.id
 * 
 * court_assignments
 *   └── room_id → rooms.id (historical, prefer court_rooms)
 * 
 * coverage_assignments
 *   └── court_room_id → court_rooms.id
 * ```
 */

/**
 * A court room record from the court_rooms table.
 * Contains court-specific configuration and metadata.
 */
export interface CourtRoom {
  /** Primary key - use this for court_room_id references */
  id: string;
  /** Human-readable room number (e.g., "1300", "763") */
  room_number: string;
  /** Optional courtroom designation (e.g., "Part A") */
  courtroom_number?: string;
  /** Foreign key to base rooms table */
  room_id: string;
  /** Court type (e.g., "supreme", "criminal") */
  court_type?: string;
  /** Operational status */
  operational_status?: string;
  /** Whether room is available */
  is_active?: boolean;
  /** Jury/juror capacity */
  jury_capacity?: number;
  juror_capacity?: number;
  /** Spectator seating capacity */
  spectator_capacity?: number;
  /** Specializations this room supports */
  specialization?: string[];
  /** Temporary location if moved */
  temporary_location?: string;
  /** Maintenance status */
  maintenance_status?: string;
  maintenance_start_date?: string;
  maintenance_end_date?: string;
  maintenance_notes?: string;
  /** General notes */
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * A court assignment record linking staff to a room for a term.
 * These are term-level assignments (months lifespan).
 */
export interface CourtAssignment {
  id: string;
  /** Room number (text field for display) */
  room_number: string;
  /** Foreign key to rooms table (base room) */
  room_id?: string;
  /** Term this assignment belongs to */
  term_id?: string;
  /** Assigned judge name */
  justice?: string;
  /** Part designation (e.g., "Part 1", "TAP 1") */
  part?: string;
  /** Assigned clerk names */
  clerks?: string[];
  /** Assigned sergeant name */
  sergeant?: string;
  /** Phone number */
  tel?: string;
  /** Fax number */
  fax?: string;
  /** Calendar day pattern */
  calendar_day?: string;
  /** Additional part details (JSON) */
  part_details?: Record<string, unknown>;
  /** Sort order for display */
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * A daily court session record.
 * These are daily activity logs (created for each day's operations).
 * 
 * Note: Sessions use court_room_id (references court_rooms.id)
 * while assignments use room_id (references rooms.id).
 */
export interface CourtSessionRecord {
  id: string;
  /** Date of the session */
  session_date: string;
  /** Session period: AM, PM, or ALL_DAY */
  period: 'AM' | 'PM' | 'ALL_DAY';
  /** Building code: 100 or 111 */
  building_code: '100' | '111';
  /** 
   * Foreign key to court_rooms.id
   * @see CourtRoom
   */
  court_room_id: string;
  /** Optional link to term assignment */
  assignment_id?: string;
  /** Session status */
  status: string;
  status_detail?: string;
  /** Estimated finish date */
  estimated_finish_date?: string;
  /** Judge name (denormalized from assignment) */
  judge_name?: string;
  /** Part number (e.g., "Part 1") */
  part_number?: string;
  /** Clerk names (denormalized from assignment) */
  clerk_names?: string[];
  /** Sergeant name (denormalized from assignment) */
  sergeant_name?: string;
  /** Calendar day pattern */
  calendar_day?: string;
  /** Who entered the parts */
  parts_entered_by?: string;
  /** Defendant names */
  defendants?: string;
  /** Session purpose */
  purpose?: string;
  /** Date case was transferred or started */
  date_transferred_or_started?: string;
  /** Top charge description */
  top_charge?: string;
  /** Attorney name */
  attorney?: string;
  /** Additional notes */
  notes?: string;
  /** Extension information */
  extension?: string;
  /** Papers/documents */
  papers?: string;
  /** User who created this record */
  created_by?: string;
  /** User who last updated this record */
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  
  /** Joined court room data (from query) */
  court_rooms?: CourtRoom;
}

/**
 * A coverage assignment record for when staff are absent.
 */
export interface CoverageAssignmentRecord {
  id: string;
  /** Date of coverage */
  coverage_date: string;
  /** Period: AM, PM, or ALL_DAY */
  period: 'AM' | 'PM' | 'ALL_DAY';
  /** Building code */
  building_code: '100' | '111';
  /**
   * Foreign key to court_rooms.id
   * @see CourtRoom
   */
  court_room_id: string;
  /** Absent staff's ID (references staff table) */
  absent_staff_id?: string;
  /** Absent staff name (denormalized) */
  absent_staff_name: string;
  /** Role of absent staff */
  absent_staff_role: string;
  /** Reason for absence */
  absence_reason?: string;
  /** Covering staff's ID */
  covering_staff_id?: string;
  /** Covering staff name */
  covering_staff_name: string;
  /** Coverage time range */
  start_time?: string;
  end_time?: string;
  /** Additional notes */
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Helper type to extract just the IDs we care about from a court room join
 */
export interface CourtRoomReference {
  /** court_rooms.id - use for court_room_id fields */
  id: string;
  /** rooms.id - use for base room lookups */
  room_id: string;
  /** Display name */
  room_number: string;
}
