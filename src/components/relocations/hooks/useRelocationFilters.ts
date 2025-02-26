import { useMemo, useState } from "react";
import { RoomRelocation, RelocationStatus } from "../types/relocationTypes";

interface UseRelocationFiltersProps {
  relocations: RoomRelocation[];
  initialFilters?: {
    searchQuery?: string;
    status?: RelocationStatus | "all";
    buildingId?: string;
    floorId?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: "startDate" | "endDate" | "status" | "originalRoom" | "temporaryRoom";
    sortDirection?: "asc" | "desc";
  };
}

export function useRelocationFilters({
  relocations,
  initialFilters = {},
}: UseRelocationFiltersProps) {
  // Filter states
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || "");
  const [statusFilter, setStatusFilter] = useState<RelocationStatus | "all">(
    initialFilters.status || "all"
  );
  const [selectedBuilding, setSelectedBuilding] = useState<string | undefined>(
    initialFilters.buildingId
  );
  const [selectedFloor, setSelectedFloor] = useState<string | undefined>(
    initialFilters.floorId
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialFilters.startDate
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialFilters.endDate
  );
  const [sortBy, setSortBy] = useState<string>(
    initialFilters.sortBy || "startDate"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    initialFilters.sortDirection || "asc"
  );

  // Filter and sort relocations
  const filteredAndSortedRelocations = useMemo(() => {
    // First, filter the relocations
    let filtered = [...relocations];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (relocation) =>
          relocation.original_room?.name?.toLowerCase().includes(query) ||
          relocation.original_room?.room_number?.toLowerCase().includes(query) ||
          relocation.temporary_room?.name?.toLowerCase().includes(query) ||
          relocation.temporary_room?.room_number?.toLowerCase().includes(query) ||
          relocation.reason?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (relocation) => relocation.status === statusFilter
      );
    }

    // Filter by building
    if (selectedBuilding) {
      filtered = filtered.filter(
        (relocation) =>
          // Access the building id through the floor relationship
          relocation.original_room?.floor?.building?.id === selectedBuilding ||
          relocation.temporary_room?.floor?.building?.id === selectedBuilding
      );
    }

    // Filter by floor
    if (selectedFloor) {
      filtered = filtered.filter(
        (relocation) =>
          relocation.original_room?.floor_id === selectedFloor ||
          relocation.temporary_room?.floor_id === selectedFloor
      );
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(
        (relocation) => new Date(relocation.start_date) >= startDate
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (relocation) => {
          // Use expected_end_date instead of end_date
          const endDateValue = relocation.expected_end_date;
          return endDateValue ? new Date(endDateValue) <= endDate : false;
        }
      );
    }

    // Then, sort the filtered relocations
    filtered.sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case "startDate":
          valueA = new Date(a.start_date).getTime();
          valueB = new Date(b.start_date).getTime();
          break;
        case "endDate":
          // Use expected_end_date instead of end_date
          valueA = a.expected_end_date ? new Date(a.expected_end_date).getTime() : 0;
          valueB = b.expected_end_date ? new Date(b.expected_end_date).getTime() : 0;
          break;
        case "status":
          valueA = a.status;
          valueB = b.status;
          break;
        case "originalRoom":
          valueA = a.original_room?.name || a.original_room?.room_number || "";
          valueB = b.original_room?.name || b.original_room?.room_number || "";
          break;
        case "temporaryRoom":
          valueA = a.temporary_room?.name || a.temporary_room?.room_number || "";
          valueB = b.temporary_room?.name || b.temporary_room?.room_number || "";
          break;
        default:
          valueA = new Date(a.start_date).getTime();
          valueB = new Date(b.start_date).getTime();
      }

      // Handle string comparison
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      // Handle number comparison
      return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
    });

    return filtered;
  }, [
    relocations,
    searchQuery,
    statusFilter,
    selectedBuilding,
    selectedFloor,
    startDate,
    endDate,
    sortBy,
    sortDirection,
  ]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSelectedBuilding(undefined);
    setSelectedFloor(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setSortBy("startDate");
    setSortDirection("asc");
  };

  return {
    // Filtered data
    filteredRelocations: filteredAndSortedRelocations,
    
    // Filter states
    searchQuery,
    statusFilter,
    selectedBuilding,
    selectedFloor,
    startDate,
    endDate,
    sortBy,
    sortDirection,
    
    // Filter setters
    setSearchQuery,
    setStatusFilter,
    setSelectedBuilding,
    setSelectedFloor,
    setStartDate,
    setEndDate,
    setSortBy,
    setSortDirection,
    
    // Reset function
    resetFilters,
  };
} 