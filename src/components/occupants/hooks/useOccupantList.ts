
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OccupantStatus } from "../schemas/occupantSchema";
import { OccupantQueryResponse, SupabaseError } from "../types/occupantTypes";

export function useOccupantList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<OccupantStatus | "all">("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedOccupants, setSelectedOccupants] = useState<string[]>([]);

  const { data: occupants, isLoading, isError, error, refetch } = useQuery<OccupantQueryResponse[], SupabaseError>({
    queryKey: ['occupants', searchQuery, departmentFilter, statusFilter],
    queryFn: async (): Promise<OccupantQueryResponse[]> => {
      console.log('Starting occupants query...'); // Debug log

      let query = supabase
        .from('occupants')
        .select(`
          *,
          key_count:key_assignments(count),
          room_count:occupant_room_assignments(count),
          rooms:occupant_room_assignments!inner(
            id,
            room_id,
            assignment_type,
            is_primary,
            schedule,
            notes,
            rooms:rooms!inner(
              id,
              name,
              room_number,
              floors:floors!inner(
                name,
                buildings:buildings!inner(
                  name
                )
              )
            )
          )
        `);

      // Apply filters
      if (searchQuery) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
        );
      }

      if (departmentFilter !== 'all') {
        query = query.eq('department', departmentFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: rawData, error } = await query
        .order('last_name');
      
      if (error) {
        console.error('Supabase query error:', error); // Debug log
        throw error;
      }

      console.log('Raw data from Supabase:', rawData); // Debug log

      // Transform the nested room data to match our types
      const transformedData: OccupantQueryResponse[] = (rawData || []).map(occupant => {
        console.log('Processing occupant:', occupant.first_name, occupant.last_name); // Debug individual occupant
        console.log('Room assignments:', occupant.rooms); // Debug room assignments
        
        return {
          ...occupant,
          room_count: occupant.room_count?.[0]?.count || 0,
          key_count: occupant.key_count?.[0]?.count || 0,
          rooms: occupant.rooms?.map((assignment: any) => {
            console.log('Processing room assignment:', assignment); // Debug individual room assignment
            return {
              id: assignment.rooms.id,
              name: assignment.rooms.name,
              room_number: assignment.rooms.room_number,
              assignment_type: assignment.assignment_type,
              is_primary: assignment.is_primary,
              schedule: assignment.schedule,
              notes: assignment.notes,
              floors: assignment.rooms.floors
            };
          }) || []
        };
      });

      console.log('Final transformed data:', transformedData); // Debug final result
      return transformedData;
    },
  });

  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const toggleSelectOccupant = (id: string) => {
    setSelectedOccupants(prev => 
      prev.includes(id) 
        ? prev.filter(occupantId => occupantId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedOccupants.length === (occupants?.length ?? 0)) {
      setSelectedOccupants([]);
    } else {
      setSelectedOccupants(occupants?.map(o => o.id) || []);
    }
  };

  const handleBulkStatusUpdate = async (status: OccupantStatus) => {
    try {
      const { error } = await supabase
        .from('occupants')
        .update({ status })
        .in('id', selectedOccupants);

      if (error) throw error;

      toast.success(`Successfully updated ${selectedOccupants.length} occupants`);
      setSelectedOccupants([]);
      refetch();
    } catch (error) {
      const err = error as SupabaseError;
      toast.error(err.message || "Error updating occupants");
    }
  };

  const handleDeleteOccupant = async (id: string) => {
    try {
      const { error } = await supabase
        .from('occupants')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Occupant deleted successfully!");
      refetch();
    } catch (error) {
      const err = error as SupabaseError;
      toast.error(err.message || "Error deleting occupant");
    }
  };

  return {
    occupants: occupants ?? [],
    isLoading,
    isError,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    expandedRows,
    toggleRow,
    selectedOccupants,
    toggleSelectOccupant,
    handleSelectAll,
    handleBulkStatusUpdate,
    handleDeleteOccupant
  };
}
