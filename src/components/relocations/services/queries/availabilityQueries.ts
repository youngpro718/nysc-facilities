import { supabase } from "@/integrations/supabase/client";
import { 
  DailyAvailability, 
  WorkAssignment, 
  CourtSession, 
  TimeSlot 
} from "../../types/relocationTypes";
import { format, addDays, parseISO, compareAsc, isWithinInterval, set } from "date-fns";

// Helper to create time slots for a day based on business hours (8AM to 6PM)
const createTimeSlots = (date: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startHour = 8; // 8:00 AM
  const endHour = 18;  // 6:00 PM
  const slotDuration = 60; // 60 minutes slots
  
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push({
      start_time: `${hour.toString().padStart(2, '0')}:00`,
      end_time: `${(hour + 1).toString().padStart(2, '0')}:00`
    });
  }
  
  return slots;
};

// Helper to check if a slot is available (not conflicting with court sessions or work assignments)
const isSlotAvailable = (
  slot: TimeSlot, 
  date: string, 
  courtSessions: CourtSession[], 
  workAssignments: WorkAssignment[]
): boolean => {
  const slotStart = new Date(`${date}T${slot.start_time}:00`);
  const slotEnd = new Date(`${date}T${slot.end_time}:00`);
  
  // Check against court sessions
  const conflictingSession = courtSessions.find(session => {
    if (session.date !== date) return false;
    const sessionStart = new Date(`${session.date}T${session.start_time}:00`);
    const sessionEnd = new Date(`${session.date}T${session.end_time}:00`);
    
    return (
      (isWithinInterval(slotStart, { start: sessionStart, end: sessionEnd }) ||
       isWithinInterval(slotEnd, { start: sessionStart, end: sessionEnd }) ||
       (slotStart <= sessionStart && slotEnd >= sessionEnd))
    );
  });
  
  if (conflictingSession) return false;
  
  // Check against work assignments
  const conflictingAssignment = workAssignments.find(assignment => {
    if (assignment.date !== date) return false;
    const assignmentStart = new Date(`${assignment.date}T${assignment.start_time}:00`);
    const assignmentEnd = new Date(`${assignment.date}T${assignment.end_time}:00`);
    
    return (
      (isWithinInterval(slotStart, { start: assignmentStart, end: assignmentEnd }) ||
       isWithinInterval(slotEnd, { start: assignmentStart, end: assignmentEnd }) ||
       (slotStart <= assignmentStart && slotEnd >= assignmentEnd))
    );
  });
  
  return !conflictingAssignment;
};

// Get work assignments for a specific relocation
export async function fetchWorkAssignments(relocationId: string): Promise<WorkAssignment[]> {
  const { data, error } = await supabase
    .from('relocation_work_assignments')
    .select('*')
    .eq('relocation_id', relocationId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
    
  if (error) throw error;
  return data || [];
}

// Get all work assignments
export async function fetchAllWorkAssignments(
  startDate?: string, 
  endDate?: string
): Promise<WorkAssignment[]> {
  let query = supabase
    .from('relocation_work_assignments')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
    
  if (startDate) {
    query = query.gte('date', startDate);
  }
  
  if (endDate) {
    query = query.lte('date', endDate);
  }
    
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Get court sessions for a specific room
export async function fetchCourtSessions(
  roomId: string, 
  startDate?: string, 
  endDate?: string
): Promise<CourtSession[]> {
  let query = supabase
    .from('court_sessions')
    .select('*')
    .eq('room_id', roomId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
    
  if (startDate) {
    query = query.gte('date', startDate);
  }
  
  if (endDate) {
    query = query.lte('date', endDate);
  }
    
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Get court sessions for a specific relocation
export async function fetchRelocationCourtSessions(relocationId: string): Promise<CourtSession[]> {
  const { data, error } = await supabase
    .from('court_sessions')
    .select('*')
    .eq('relocation_id', relocationId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
    
  if (error) throw error;
  return data || [];
}

// Calculate room availability for a date range
export async function fetchRoomAvailability(
  roomId: string, 
  startDate: string, 
  endDate: string
): Promise<DailyAvailability[]> {
  // Fetch court sessions and work assignments for this room and date range
  const [courtSessions, workAssignments] = await Promise.all([
    fetchCourtSessions(roomId, startDate, endDate),
    fetchAllWorkAssignments(startDate, endDate)
  ]);
  
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const dailyAvailability: DailyAvailability[] = [];
  
  // Initialize a day pointer
  let currentDay = start;
  
  // Loop through each day
  while (compareAsc(currentDay, end) <= 0) {
    const formattedDate = format(currentDay, 'yyyy-MM-dd');
    
    // Get sessions and assignments for this day
    const todaySessions = courtSessions.filter(s => s.date === formattedDate);
    const todayAssignments = workAssignments.filter(a => a.date === formattedDate);
    
    // Create default time slots
    const allSlots = createTimeSlots(formattedDate);
    
    // Filter available slots
    const availableSlots = allSlots.filter(slot => 
      isSlotAvailable(slot, formattedDate, todaySessions, todayAssignments)
    );
    
    // Add day to result
    dailyAvailability.push({
      date: formattedDate,
      room_id: roomId,
      is_available: availableSlots.length > 0,
      available_slots: availableSlots,
      court_sessions: todaySessions,
      work_assignments: todayAssignments.filter(a => 
        a.status === 'scheduled' || a.status === 'in_progress'
      )
    });
    
    // Move to next day
    currentDay = addDays(currentDay, 1);
  }
  
  return dailyAvailability;
}

// Calculate availability for multiple rooms 
export async function fetchMultiRoomAvailability(
  roomIds: string[], 
  startDate: string, 
  endDate: string
): Promise<{ [roomId: string]: DailyAvailability[] }> {
  const results: { [roomId: string]: DailyAvailability[] } = {};
  
  // We could do this in parallel but sequential might be better for performance
  for (const roomId of roomIds) {
    results[roomId] = await fetchRoomAvailability(roomId, startDate, endDate);
  }
  
  return results;
}
