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
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);

  // Fetch all room assignments with joined data
  const { data: assignments, isLoading, error, refetch } = useQuery({
    queryKey: ["room-assignments", searchQuery, departmentFilter, assignmentTypeFilter, statusFilter],
    queryFn: async () => {
      // Try a simple query without joins first
      const { data: simpleData, error: simpleError } = await supabase
        .from("occupant_room_assignments")
        .select("*");

      if (simpleError) {
        console.error("Simple query failed:", simpleError);
        throw simpleError;
      }

      // Fetch data separately to avoid relationship issues
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

      if (occupantsError) throw occupantsError;
      if (roomsError) throw roomsError;

      // Create lookup maps
      const occupantsMap = new Map(occupantsData?.map(o => [o.id, o]) || []);
      const roomsMap = new Map(roomsData?.map(r => [r.id, r]) || []);

      // Combine the data manually
      let filteredData = simpleData || [];

      // Apply filters on the raw data
      if (searchQuery) {
        filteredData = filteredData.filter(assignment => {
          const occupant = occupantsMap.get(assignment.occupant_id);
          const room = roomsMap.get(assignment.room_id);
          const searchTerm = searchQuery.toLowerCase();
          
          return (
            occupant?.first_name?.toLowerCase().includes(searchTerm) ||
            occupant?.last_name?.toLowerCase().includes(searchTerm) ||
            occupant?.email?.toLowerCase().includes(searchTerm) ||
            room?.room_number?.toLowerCase().includes(searchTerm) ||
            room?.name?.toLowerCase().includes(searchTerm)
          );
        });
      }

      if (departmentFilter && departmentFilter !== "all") {
        filteredData = filteredData.filter(assignment => {
          const occupant = occupantsMap.get(assignment.occupant_id);
          return occupant?.department === departmentFilter;
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
          return occupant?.status === statusFilter;
        });
      }

      // Sort by assigned_at descending
      filteredData.sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime());

      // Transform the data to flatten the structure
      return filteredData.map((assignment: any): RoomAssignmentWithDetails => {
        const occupant = occupantsMap.get(assignment.occupant_id);
        const room = roomsMap.get(assignment.room_id);
        
        return {
          id: assignment.id,
          occupant_id: assignment.occupant_id,
          room_id: assignment.room_id,
          assignment_type: assignment.assignment_type,
          is_primary: assignment.is_primary,
          assigned_at: assignment.assigned_at,
          schedule: assignment.schedule,
          notes: assignment.notes,
          updated_at: assignment.updated_at,
          occupant_name: occupant ? `${occupant.first_name} ${occupant.last_name}` : 'Unknown',
          occupant_email: occupant?.email || '',
          department: occupant?.department,
          room_number: room?.room_number || '',
          room_name: room?.name || '',
          floor_name: (room as any)?.floors?.name || '',
          building_name: (room as any)?.floors?.buildings?.name || '',
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