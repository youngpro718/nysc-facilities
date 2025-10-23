import { supabase } from "@/lib/supabase";

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: Conflict[];
  warnings: Warning[];
  summary: {
    totalConflicts: number;
    criticalConflicts: number;
    warnings: number;
  };
}

export interface Conflict {
  id: string;
  type: "double_booked_judge" | "missing_required_staff" | "duplicate_part" | "invalid_assignment";
  severity: "critical" | "high" | "medium";
  title: string;
  description: string;
  affectedRooms: string[];
  affectedPersonnel: string[];
  suggestedAction: string;
}

export interface Warning {
  id: string;
  type: "incomplete_assignment" | "missing_contact_info" | "no_coverage" | "session_conflict";
  title: string;
  description: string;
  affectedRooms: string[];
}

export class ConflictDetectionService {
  /**
   * Detect all conflicts in court assignments
   */
  static async detectConflicts(): Promise<ConflictDetectionResult> {
    const [
      doubleBookedJudges,
      duplicateParts,
      missingRequiredStaff,
      incompleteAssignments,
    ] = await Promise.all([
      this.detectDoubleBookedJudges(),
      this.detectDuplicateParts(),
      this.detectMissingRequiredStaff(),
      this.detectIncompleteAssignments(),
    ]);

    const conflicts = [
      ...doubleBookedJudges,
      ...duplicateParts,
      ...missingRequiredStaff,
    ];

    const warnings = [...incompleteAssignments];

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      warnings,
      summary: {
        totalConflicts: conflicts.length,
        criticalConflicts: conflicts.filter(c => c.severity === "critical").length,
        warnings: warnings.length,
      },
    };
  }

  /**
   * Detect judges assigned to multiple courtrooms
   */
  private static async detectDoubleBookedJudges(): Promise<Conflict[]> {
    const { data: assignments, error } = await supabase
      .from("court_assignments")
      .select(`
        id, 
        room_id,
        justice, 
        part,
        rooms!inner(room_number)
      `)
      .not("justice", "is", null);

    if (error || !assignments) return [];

    // Group by judge name
    const judgeAssignments = new Map<string, typeof assignments>();
    assignments.forEach(assignment => {
      const judge = assignment.justice;
      if (!judgeAssignments.has(judge)) {
        judgeAssignments.set(judge, []);
      }
      judgeAssignments.get(judge)!.push(assignment);
    });

    // Find judges with multiple assignments
    const conflicts: Conflict[] = [];
    judgeAssignments.forEach((rooms, judge) => {
      if (rooms.length > 1) {
        conflicts.push({
          id: `double-booked-${judge}`,
          type: "double_booked_judge",
          severity: "critical",
          title: `Judge ${judge} is double-booked`,
          description: `${judge} is assigned to ${rooms.length} courtrooms simultaneously`,
          affectedRooms: rooms.map(r => (r as any).rooms?.room_number || r.room_id),
          affectedPersonnel: [judge],
          suggestedAction: `Remove ${judge} from all but one courtroom or verify if this is intentional (e.g., covering multiple parts)`,
        });
      }
    });

    return conflicts;
  }

  /**
   * Detect duplicate part numbers
   */
  private static async detectDuplicateParts(): Promise<Conflict[]> {
    const { data: assignments, error } = await supabase
      .from("court_assignments")
      .select(`
        id, 
        room_id, 
        part, 
        justice,
        rooms!inner(room_number)
      `)
      .not("part", "is", null);

    if (error || !assignments) return [];

    // Group by part number
    const partAssignments = new Map<string, typeof assignments>();
    assignments.forEach(assignment => {
      const part = assignment.part;
      if (!partAssignments.has(part)) {
        partAssignments.set(part, []);
      }
      partAssignments.get(part)!.push(assignment);
    });

    // Find duplicate parts
    const conflicts: Conflict[] = [];
    partAssignments.forEach((rooms, part) => {
      if (rooms.length > 1) {
        conflicts.push({
          id: `duplicate-part-${part}`,
          type: "duplicate_part",
          severity: "high",
          title: `Part ${part} is assigned to multiple rooms`,
          description: `Part number ${part} appears in ${rooms.length} different courtroom assignments`,
          affectedRooms: rooms.map(r => (r as any).rooms?.room_number || r.room_id),
          affectedPersonnel: rooms.map(r => r.justice).filter(Boolean),
          suggestedAction: `Ensure each part number is unique. Update one of the assignments to use a different part number.`,
        });
      }
    });

    return conflicts;
  }

  /**
   * Detect assignments missing required staff
   */
  private static async detectMissingRequiredStaff(): Promise<Conflict[]> {
    const { data: assignments, error } = await supabase
      .from("court_assignments")
      .select(`
        id, 
        room_id, 
        justice, 
        clerks, 
        sergeant, 
        part,
        rooms!inner(room_number)
      `);

    if (error || !assignments) return [];

    const conflicts: Conflict[] = [];

    assignments.forEach(assignment => {
      const missing: string[] = [];
      const roomNumber = (assignment as any).rooms?.room_number || assignment.room_id;

      // Check for missing judge
      if (!assignment.justice || assignment.justice.trim() === "") {
        missing.push("Judge");
      }

      // Check for missing clerks
      if (!assignment.clerks || assignment.clerks.length === 0) {
        missing.push("Clerk(s)");
      }

      // Check for missing sergeant
      if (!assignment.sergeant || assignment.sergeant.trim() === "") {
        missing.push("Sergeant");
      }

      if (missing.length > 0) {
        conflicts.push({
          id: `missing-staff-${assignment.room_id}`,
          type: "missing_required_staff",
          severity: "high",
          title: `Room ${roomNumber} missing required staff`,
          description: `Missing: ${missing.join(", ")}`,
          affectedRooms: [roomNumber],
          affectedPersonnel: [],
          suggestedAction: `Assign ${missing.join(", ")} to complete this courtroom assignment`,
        });
      }
    });

    return conflicts;
  }

  /**
   * Detect incomplete assignments (warnings, not critical)
   */
  private static async detectIncompleteAssignments(): Promise<Warning[]> {
    const { data: assignments, error } = await supabase
      .from("court_assignments")
      .select(`
        id, 
        room_id, 
        justice, 
        part, 
        fax, 
        tel,
        rooms!inner(room_number)
      `);

    if (error || !assignments) return [];

    const warnings: Warning[] = [];

    assignments.forEach(assignment => {
      const issues: string[] = [];
      const roomNumber = (assignment as any).rooms?.room_number || assignment.room_id;

      // Check for missing part number
      if (!assignment.part || assignment.part.trim() === "") {
        issues.push("Part number");
      }

      // Check for missing contact info
      if (!assignment.fax || assignment.fax.trim() === "") {
        issues.push("Fax number");
      }

      if (!assignment.tel || assignment.tel.trim() === "") {
        issues.push("Phone number");
      }

      if (issues.length > 0) {
        warnings.push({
          id: `incomplete-${assignment.room_id}`,
          type: "incomplete_assignment",
          title: `Incomplete assignment for room ${roomNumber}`,
          description: `Missing: ${issues.join(", ")}`,
          affectedRooms: [roomNumber],
        });
      }
    });

    return warnings;
  }

  /**
   * Validate a specific assignment before saving
   */
  static async validateAssignment(assignment: {
    room_id: string;
    justice?: string;
    part?: string;
    clerks?: string[];
    sergeant?: string;
  }): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for double-booked judge
    if (assignment.justice) {
      const { data: existingAssignments } = await supabase
        .from("court_assignments")
        .select("room_id")
        .eq("justice", assignment.justice)
        .neq("room_id", assignment.room_id);

      if (existingAssignments && existingAssignments.length > 0) {
        errors.push(
          `Judge ${assignment.justice} is already assigned to room ${existingAssignments[0].room_id}`
        );
      }
    }

    // Check for duplicate part number
    if (assignment.part) {
      const { data: existingParts } = await supabase
        .from("court_assignments")
        .select("room_id, justice")
        .eq("part", assignment.part)
        .neq("room_id", assignment.room_id);

      if (existingParts && existingParts.length > 0) {
        errors.push(
          `Part ${assignment.part} is already assigned to room ${existingParts[0].room_id}`
        );
      }
    }

    // Check for required fields
    if (!assignment.justice) {
      errors.push("Judge is required");
    }

    if (!assignment.clerks || assignment.clerks.length === 0) {
      errors.push("At least one clerk is required");
    }

    if (!assignment.sergeant) {
      errors.push("Sergeant is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate session assignment before saving
   */
  static async validateSessionAssignment(session: {
    judge_name: string;
    part_number: string;
    court_room_id: string;
    session_date: string;
    period: string;
    building_code: string;
  }): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // 1. Check judge not double-booked same date/period
    const { data: existingSessions } = await supabase
      .from('court_sessions')
      .select('court_rooms(room_number)')
      .eq('session_date', session.session_date)
      .eq('period', session.period)
      .eq('building_code', session.building_code)
      .eq('judge_name', session.judge_name)
      .neq('court_room_id', session.court_room_id);
    
    if (existingSessions && existingSessions.length > 0) {
      errors.push(`Judge ${session.judge_name} already assigned to room ${(existingSessions[0] as any).court_rooms.room_number} for this period`);
    }
    
    // 2. Check part number unique (if provided)
    if (session.part_number) {
      const { data: existingParts } = await supabase
        .from('court_sessions')
        .select('court_rooms(room_number)')
        .eq('session_date', session.session_date)
        .eq('period', session.period)
        .eq('building_code', session.building_code)
        .eq('part_number', session.part_number)
        .neq('court_room_id', session.court_room_id);
      
      if (existingParts && existingParts.length > 0) {
        errors.push(`Part ${session.part_number} already assigned to room ${(existingParts[0] as any).court_rooms.room_number}`);
      }
    }
    
    // 3. Check if room is shutdown/maintenance
    const { data: shutdown } = await supabase
      .from('room_shutdowns')
      .select('*')
      .eq('room_id', session.court_room_id)
      .in('status', ['in_progress', 'scheduled'])
      .maybeSingle();
    
    if (shutdown) {
      errors.push('Room is under maintenance and cannot be scheduled');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
