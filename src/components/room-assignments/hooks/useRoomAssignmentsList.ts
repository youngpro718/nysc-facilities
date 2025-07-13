import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RoomAssignmentWithDetails {
  id: string;
  occupant_id: string;
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
}

export function useRoomAssignmentsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);

  // Fetch all room assignments with joined data
  const { data: assignments, isLoading, error, refetch } = useQuery({
    queryKey: ["room-assignments", searchQuery, departmentFilter, assignmentTypeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("occupant_room_assignments")
        .select(`
          *,
          occupants!inner (
            first_name,
            last_name,
            email,
            department,
            status
          ),
          rooms!inner (
            room_number,
            name,
            floors!inner (
              name,
              buildings!inner (
                name
              )
            )
          )
        `);

      // Apply filters
      if (searchQuery) {
        query = query.or(
          `occupants.first_name.ilike.%${searchQuery}%,occupants.last_name.ilike.%${searchQuery}%,occupants.email.ilike.%${searchQuery}%,rooms.room_number.ilike.%${searchQuery}%,rooms.name.ilike.%${searchQuery}%`
        );
      }

      if (departmentFilter) {
        query = query.eq("occupants.department", departmentFilter);
      }

      if (assignmentTypeFilter) {
        query = query.eq("assignment_type", assignmentTypeFilter);
      }

      if (statusFilter) {
        query = query.eq("occupants.status", statusFilter as "active" | "inactive" | "on_leave" | "terminated");
      }

      const { data, error } = await query.order("assigned_at", { ascending: false });

      if (error) throw error;

      // Transform the data to flatten the structure
      return data?.map((assignment: any): RoomAssignmentWithDetails => ({
        id: assignment.id,
        occupant_id: assignment.occupant_id,
        room_id: assignment.room_id,
        assignment_type: assignment.assignment_type,
        is_primary: assignment.is_primary,
        assigned_at: assignment.assigned_at,
        schedule: assignment.schedule,
        notes: assignment.notes,
        updated_at: assignment.updated_at,
        occupant_name: `${assignment.occupants.first_name} ${assignment.occupants.last_name}`,
        occupant_email: assignment.occupants.email,
        department: assignment.occupants.department,
        room_number: assignment.rooms.room_number,
        room_name: assignment.rooms.name,
        floor_name: assignment.rooms.floors.name,
        building_name: assignment.rooms.floors.buildings.name,
      })) || [];
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
      toast.error("Failed to update assignment");
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
      toast.error("Failed to delete assignments");
    }
  }, [selectedAssignments, refetch]);

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
    handleUpdateAssignment,
  };
}