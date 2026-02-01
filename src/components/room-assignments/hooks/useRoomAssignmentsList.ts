import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface RoomAssignmentWithDetails {
  id: string;
  occupant_id: string | null;
  profile_id: string | null;
  personnel_profile_id: string | null;
  room_id: string;
  assignment_type: string;
  is_primary: boolean;
  assigned_at: string;
  schedule?: string;
  notes?: string;
  updated_at: string;
  // Joined data
  occupant_name: string;
  occupant_email: string;
  department?: string;
  room_number: string;
  room_name: string;
  floor_name: string;
  building_name: string;
  source_type: 'profile' | 'personnel_profile' | 'occupant';
}

export function useRoomAssignmentsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);

  // Fetch all room assignments with joined data
  const { data: assignments, isLoading, error, refetch } = useQuery({
    queryKey: ["room-assignments", searchQuery, departmentFilter, assignmentTypeFilter, statusFilter],
    queryFn: async () => {
      // Fetch all assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("occupant_room_assignments")
        .select("*");

      if (assignmentsError) {
        console.error("Assignments query failed:", assignmentsError);
        throw assignmentsError;
      }

      // Fetch personnel from the view (includes both profiles and personnel_profiles)
      const { data: personnelData, error: personnelError } = await supabase
        .from("personnel_access_view")
        .select("id, name, email, department, source_type");

      // Fetch legacy occupants
      const { data: occupantsData, error: occupantsError } = await supabase
        .from("occupants")
        .select("id, first_name, last_name, email, department, status");

      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select(`
          id, 
          room_number, 
          name,
          floors (
            name,
            buildings (
              name
            )
          )
        `);

      if (personnelError) throw personnelError;
      if (occupantsError) throw occupantsError;
      if (roomsError) throw roomsError;

      // Create lookup maps
      const personnelMap = new Map(personnelData?.map(p => [p.id, p]) || []);
      const occupantsMap = new Map(occupantsData?.map(o => [o.id, o]) || []);
      const roomsMap = new Map(roomsData?.map(r => [r.id, r]) || []);

      // Combine the data manually
      let filteredData = assignmentsData || [];

      // Apply filters on the raw data
      if (searchQuery) {
        filteredData = filteredData.filter(assignment => {
          // Look up person from all possible sources
          const person = personnelMap.get(assignment.profile_id) || 
                        personnelMap.get(assignment.personnel_profile_id) ||
                        occupantsMap.get(assignment.occupant_id);
          const room = roomsMap.get(assignment.room_id);
          const searchTerm = searchQuery.toLowerCase();
          
          const personName = (person as any)?.name || 
            ((person as any)?.first_name ? `${(person as any).first_name} ${(person as any).last_name}` : '');
          
          return (
            personName?.toLowerCase().includes(searchTerm) ||
            (person as any)?.email?.toLowerCase().includes(searchTerm) ||
            (room as any)?.room_number?.toLowerCase().includes(searchTerm) ||
            (room as any)?.name?.toLowerCase().includes(searchTerm)
          );
        });
      }

      if (departmentFilter && departmentFilter !== "all") {
        filteredData = filteredData.filter(assignment => {
          const person = personnelMap.get(assignment.profile_id) || 
                        personnelMap.get(assignment.personnel_profile_id) ||
                        occupantsMap.get(assignment.occupant_id);
          return (person as any)?.department === departmentFilter;
        });
      }

      if (assignmentTypeFilter && assignmentTypeFilter !== "all") {
        filteredData = filteredData.filter(assignment => 
          assignment.assignment_type === assignmentTypeFilter
        );
      }

      if (statusFilter && statusFilter !== "all") {
        filteredData = filteredData.filter(assignment => {
          const occupant = occupantsMap.get(assignment.occupant_id);
          return (occupant as any)?.status === statusFilter;
        });
      }

      // Sort by assigned_at descending
      filteredData.sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime());

      // Transform the data to flatten the structure
      return filteredData.map((assignment: any): RoomAssignmentWithDetails => {
        // Determine which source the person comes from
        let person: any = null;
        let sourceType: 'profile' | 'personnel_profile' | 'occupant' = 'occupant';
        
        if (assignment.profile_id) {
          person = personnelMap.get(assignment.profile_id);
          sourceType = 'profile';
        } else if (assignment.personnel_profile_id) {
          person = personnelMap.get(assignment.personnel_profile_id);
          sourceType = 'personnel_profile';
        } else if (assignment.occupant_id) {
          person = occupantsMap.get(assignment.occupant_id);
          sourceType = 'occupant';
        }
        
        const room = roomsMap.get(assignment.room_id);
        
        // Get person name - handle both view format and occupants format
        const personName = person?.name || 
          (person?.first_name ? `${person.first_name} ${person.last_name}` : 'Unknown');
        
        return {
          id: assignment.id,
          occupant_id: assignment.occupant_id,
          profile_id: assignment.profile_id,
          personnel_profile_id: assignment.personnel_profile_id,
          room_id: assignment.room_id,
          assignment_type: assignment.assignment_type,
          is_primary: assignment.is_primary,
          assigned_at: assignment.assigned_at,
          schedule: assignment.schedule,
          notes: assignment.notes,
          updated_at: assignment.updated_at,
          occupant_name: personName,
          occupant_email: person?.email || '',
          department: person?.department,
          room_number: room?.room_number || '',
          room_name: room?.name || '',
          floor_name: (room as any)?.floors?.name || '',
          building_name: (room as any)?.floors?.buildings?.name || '',
          source_type: sourceType,
        };
      });
    },
  });

  const toggleSelectAssignment = useCallback((assignmentId: string) => {
    setSelectedAssignments(prev => 
      prev.includes(assignmentId) 
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedAssignments.length === assignments?.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(assignments?.map(a => a.id) || []);
    }
  }, [selectedAssignments, assignments]);

  const handleUpdateAssignment = useCallback(async (
    assignmentId: string, 
    updates: Partial<RoomAssignmentWithDetails>
  ) => {
    try {
      const { error } = await supabase
        .from("occupant_room_assignments")
        .update(updates)
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Assignment updated successfully");
      refetch();
    } catch (error) {
      console.error("Error updating assignment:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update assignment";
      toast.error(errorMessage);
      throw error;
    }
  }, [refetch]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedAssignments.length === 0) return;

    try {
      const { error } = await supabase
        .from("occupant_room_assignments")
        .delete()
        .in("id", selectedAssignments);

      if (error) throw error;

      toast.success(`${selectedAssignments.length} assignments deleted`);
      setSelectedAssignments([]);
      refetch();
    } catch (error) {
      console.error("Error deleting assignments:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete assignments";
      toast.error(errorMessage);
      throw error;
    }
  }, [selectedAssignments, refetch]);

  const handleDeleteAssignment = useCallback(async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("occupant_room_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Assignment deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete assignment";
      toast.error(errorMessage);
      throw error;
    }
  }, [refetch]);

  return {
    assignments,
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    departmentFilter,
    setDepartmentFilter,
    assignmentTypeFilter,
    setAssignmentTypeFilter,
    statusFilter,
    setStatusFilter,
    selectedAssignments,
    toggleSelectAssignment,
    handleSelectAll,
    handleBulkDelete,
    handleDeleteAssignment,
    handleUpdateAssignment,
  };
}
