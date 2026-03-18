// Court Conflict Detection Service
import { supabase } from "@/lib/supabase";
import { logger } from '@/lib/logger';

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
  type: "incomplete_assignment" | "missing_contact_info" | "no_coverage" | "session_conflict" | "missing_session_coverage";
  title: string;
  description: string;
  affectedRooms: string[];
  severity?: "low" | "medium" | "high";
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
        const roomNumbers = rooms.map(r => (r as any).rooms?.room_number || r.room_id);
        const roomParts = rooms.map(r => {
          const rn = (r as any).rooms?.room_number || r.room_id;
          return r.part ? `Room ${rn} (Part ${r.part})` : `Room ${rn}`;
        });
        conflicts.push({
          id: `double-booked-${judge}`,
          type: "double_booked_judge",
          severity: "critical",
          title: `${judge} assigned to ${rooms.length} rooms`,
          description: `Justice ${judge} appears in ${roomParts.join(" and ")}. Only one assignment should be active at a time.`,
          affectedRooms: roomNumbers,
          affectedPersonnel: [judge],
          suggestedAction: `Go to ${roomParts.slice(1).join(" or ")} and either clear the justice field or reassign to a different judge.`,
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
        const roomNumbers = rooms.map(r => (r as any).rooms?.room_number || r.room_id);
        const roomDetails = rooms.map(r => {
          const rn = (r as any).rooms?.room_number || r.room_id;
          return r.justice ? `Room ${rn} (${r.justice})` : `Room ${rn}`;
        });
        conflicts.push({
          id: `duplicate-part-${part}`,
          type: "duplicate_part",
          severity: "high",
          title: `Part ${part} duplicated across ${rooms.length} rooms`,
          description: `Part ${part} is assigned to ${roomDetails.join(" and ")}. Each part number must be unique.`,
          affectedRooms: roomNumbers,
          affectedPersonnel: rooms.map(r => r.justice).filter(Boolean),
          suggestedAction: `Open ${roomDetails.slice(1).join(" or ")} and change the part number to resolve the duplicate.`,
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

      if (!assignment.justice || assignment.justice.trim() === "") {
        missing.push("Justice");
      }
      if (!assignment.clerks || assignment.clerks.length === 0) {
        missing.push("Clerk");
      }
      if (!assignment.sergeant || assignment.sergeant.trim() === "") {
        missing.push("Sergeant");
      }

      if (missing.length > 0) {
        // Severity based on how many roles are missing
        const severity: "critical" | "high" | "medium" = missing.length >= 3 ? "critical" : missing.length >= 2 ? "high" : "medium";
        conflicts.push({
          id: `missing-staff-${assignment.room_id}`,
          type: "missing_required_staff",
          severity,
          title: `Room ${roomNumber}: ${missing.join(", ")} needed`,
          description: `Room ${roomNumber}${assignment.part ? ` (Part ${assignment.part})` : ''} is missing ${missing.join(" and ")}. ${missing.length === 3 ? 'This courtroom is entirely unstaffed.' : `Currently has ${assignment.justice || 'no justice'}.`}`,
          affectedRooms: [roomNumber],
          affectedPersonnel: [],
          suggestedAction: `Open Room ${roomNumber} in the Assignments tab and assign the missing ${missing.join(" and ")}.`,
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

      if (!assignment.part || assignment.part.trim() === "") {
        issues.push("Part number");
      }
      if (!assignment.fax || assignment.fax.trim() === "") {
        issues.push("Fax");
      }
      if (!assignment.tel || assignment.tel.trim() === "") {
        issues.push("Phone");
      }

      if (issues.length > 0) {
        warnings.push({
          id: `incomplete-${assignment.room_id}`,
          type: "incomplete_assignment",
          title: `Room ${roomNumber}: missing ${issues.join(", ")}`,
          description: `Room ${roomNumber}${assignment.justice ? ` (${assignment.justice})` : ''} is missing ${issues.join(" and ")}. ${issues.includes("Part number") ? "Part number is required for scheduling." : "Contact info helps with daily operations."}`,
          affectedRooms: [roomNumber],
          severity: issues.includes("Part number") ? "medium" : "low",
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
      errors.push(`Judge ${session.judge_name} already assigned to room ${(existingSessions[0] as any).court_rooms?.room_number} for this period`);
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
        errors.push(`Part ${session.part_number} already assigned to room ${(existingParts[0] as any).court_rooms?.room_number}`);
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

  /**
   * Detect missing coverage for sessions with absent judges
   */
  static async detectMissingSessionCoverage(
    date: string,
    period: string,
    buildingCode: string
  ): Promise<Warning[]> {
    const warnings: Warning[] = [];

    try {
      // Get all sessions for this date/period/building
      const { data: sessions } = await supabase
        .from('court_sessions')
        .select('id, judge_name, court_room_id, court_rooms(room_number)')
        .eq('session_date', date)
        .eq('period', period)
        .eq('building_code', buildingCode);

      if (!sessions || sessions.length === 0) return warnings;

      // Get all coverage assignments for this date/period/building
      const { data: coverages } = await supabase
        .from('coverage_assignments')
        .select('court_room_id, absent_staff_name')
        .eq('coverage_date', date)
        .eq('period', period)
        .eq('building_code', buildingCode);

      const coveredRooms = new Set(coverages?.map(c => c.court_room_id) || []);

      // Get staff absences for this date
      const { data: absences } = await supabase
        .from('staff_absences')
        .select(`
          staff_id, 
          kind, 
          absence_reason,
          staff:staff_id (
            display_name,
            role
          )
        `)
        .lte('starts_on', date)
        .gte('ends_on', date);

      // Filter for judges only
      const absentJudgeNames = new Set(
        absences
          ?.filter((a: any) => a.staff?.role === 'judge')
          .map((a: any) => a.staff?.display_name)
          .filter(Boolean) || []
      );

      // Check each session for missing coverage
      for (const session of sessions) {
        const isJudgeAbsent = session.judge_name && absentJudgeNames.has(session.judge_name);
        const hasCoverage = coveredRooms.has(session.court_room_id);

        if (isJudgeAbsent && !hasCoverage) {
          warnings.push({
            id: `missing_coverage_${session.id}`,
            type: 'missing_session_coverage',
            severity: 'high',
            title: `Missing Coverage for ${session.judge_name}`,
            description: `Judge ${session.judge_name} is marked absent but no coverage has been assigned for room ${(session as any).court_rooms?.room_number}`,
            affectedRooms: [(session as any).court_rooms?.room_number || 'Unknown'],
          });
        }
      }
    } catch (error) {
      logger.error('Error detecting missing session coverage:', error);
    }

    return warnings;
  }

  /**
   * Detect session conflicts (judge double-booking, duplicate parts)
   */
  static async detectSessionConflicts(
    date: string,
    period: string,
    buildingCode: string
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    try {
      // Get all sessions for this date/period/building
      const { data: sessions } = await supabase
        .from('court_sessions')
        .select('id, judge_name, part_number, court_room_id, court_rooms(room_number)')
        .eq('session_date', date)
        .eq('period', period)
        .eq('building_code', buildingCode);

      if (!sessions || sessions.length === 0) return conflicts;

      // Check for judge double-booking
      const judgeRooms = new Map<string, any[]>();
      sessions.forEach(session => {
        if (session.judge_name) {
          if (!judgeRooms.has(session.judge_name)) {
            judgeRooms.set(session.judge_name, []);
          }
          judgeRooms.get(session.judge_name)!.push(session);
        }
      });

      judgeRooms.forEach((rooms, judge) => {
        if (rooms.length > 1) {
          conflicts.push({
            id: `double_booked_judge_${judge}_${date}_${period}`,
            type: 'double_booked_judge',
            severity: 'critical',
            title: `Judge ${judge} Double-Booked`,
            description: `Judge ${judge} is assigned to multiple courtrooms for the same period`,
            affectedRooms: rooms.map(r => (r as any).court_rooms?.room_number || 'Unknown'),
            affectedPersonnel: [judge],
            suggestedAction: 'Remove duplicate assignments or assign coverage',
          });
        }
      });

      // Check for duplicate part numbers
      const partRooms = new Map<string, any[]>();
      sessions.forEach(session => {
        if (session.part_number) {
          if (!partRooms.has(session.part_number)) {
            partRooms.set(session.part_number, []);
          }
          partRooms.get(session.part_number)!.push(session);
        }
      });

      partRooms.forEach((rooms, part) => {
        if (rooms.length > 1) {
          conflicts.push({
            id: `duplicate_part_${part}_${date}_${period}`,
            type: 'duplicate_part',
            severity: 'high',
            title: `Duplicate Part Number: ${part}`,
            description: `Part ${part} is assigned to multiple courtrooms`,
            affectedRooms: rooms.map(r => (r as any).court_rooms?.room_number || 'Unknown'),
            affectedPersonnel: [],
            suggestedAction: 'Assign unique part numbers to each courtroom',
          });
        }
      });
    } catch (error) {
      logger.error('Error detecting session conflicts:', error);
    }

    return conflicts;
  }

  /**
   * Get all conflicts and warnings for a specific date/period/building
   */
  static async detectDailySessionIssues(
    date: string,
    period: string,
    buildingCode: string
  ): Promise<ConflictDetectionResult> {
    const [sessionConflicts, coverageWarnings] = await Promise.all([
      this.detectSessionConflicts(date, period, buildingCode),
      this.detectMissingSessionCoverage(date, period, buildingCode),
    ]);

    return {
      hasConflicts: sessionConflicts.length > 0,
      conflicts: sessionConflicts,
      warnings: coverageWarnings,
      summary: {
        totalConflicts: sessionConflicts.length,
        criticalConflicts: sessionConflicts.filter(c => c.severity === 'critical').length,
        warnings: coverageWarnings.length,
      },
    };
  }
}
