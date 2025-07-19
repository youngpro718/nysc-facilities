
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OccupantStatus } from "../schemas/occupantSchema";
import { OccupantQueryResponse, RoomDetails, SupabaseError } from "../types/occupantTypes";

// Utility function to parse room data
const parseRoomData = (room: any): RoomDetails => ({
  name: String(room?.name || ''),
  room_number: String(room?.room_number || ''),
  floors: room?.floors ? {
    name: String(room.floors?.name || ''),
    buildings: room.floors?.buildings ? {
      name: String(room.floors.buildings?.name || '')
    } : undefined
  } : undefined
});

// Utility function to parse rooms array
const parseRoomsData = (roomsData: any): RoomDetails[] => {
  try {
    if (!roomsData) return [];
    
    const parsedRooms = typeof roomsData === 'string' 
      ? JSON.parse(roomsData) 
      : roomsData;

    return Array.isArray(parsedRooms) 
      ? parsedRooms.map(parseRoomData)
      : [];
  } catch (e) {
    console.error('Error parsing rooms data:', e);
    return [];
  }
};

// Transform occupant data
const transformOccupantData = (occupant: any): OccupantQueryResponse => {
  // Extract rooms from the nested structure
  const roomAssignments = occupant.occupant_room_assignments || [];
  const rooms = roomAssignments.map((assignment: any) => assignment.rooms).filter(Boolean);
  
  console.log('Processing occupant:', occupant.first_name, occupant.last_name);
  console.log('Room assignments:', roomAssignments);
  console.log('Extracted rooms:', rooms);
  console.log('Key assignments:', occupant.key_assignments);
  
  return {
    id: occupant.id,
    first_name: occupant.first_name || '',
    last_name: occupant.last_name || '',
    email: occupant.email,
    phone: occupant.phone,
    department: occupant.department,
    title: occupant.title,
    role: occupant.role,
    status: occupant.status || 'inactive',
    key_count: Array.isArray(occupant.key_assignments) ? occupant.key_assignments.length : 0,
    room_count: Array.isArray(roomAssignments) ? roomAssignments.length : 0,
    rooms: rooms.map(parseRoomData)
  };
};

export function useOccupantList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<OccupantStatus | "all">("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedOccupants, setSelectedOccupants] = useState<string[]>([]);

  const { data: occupants, isLoading, isError, error, refetch } = useQuery<OccupantQueryResponse[], SupabaseError>({
    queryKey: ['occupants', searchQuery, departmentFilter, statusFilter],
    queryFn: async (): Promise<OccupantQueryResponse[]> => {
      console.log('Starting occupants query...');

      let query = supabase
        .from('occupants')
        .select(`
          *,
          key_assignments!inner(id),
          occupant_room_assignments!fk_occupant(
            id,
            rooms!occupant_room_assignments_room_id_fkey(
              id,
              name,
              room_number,
              floors(
                name,
                buildings(name)
              )
            )
          )
        `);

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
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Raw data from Supabase:', rawData);
      const transformedData = (rawData || []).map(transformOccupantData);
      console.log('Final transformed data:', transformedData);
      
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
