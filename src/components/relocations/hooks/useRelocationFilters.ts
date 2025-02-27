import { useState, useMemo } from "react";
import { RoomRelocation } from "../types/relocationTypes";

export function useRelocationFilters(relocations: RoomRelocation[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sortOrder, setSortOrder] = useState<'date-asc' | 'date-desc' | 'duration-asc' | 'duration-desc'>('date-desc');

  const filteredRelocations = useMemo(() => {
    let filtered = [...relocations];

    filtered = filterRelocations(filtered);
    filtered = sortRelocations(filtered);

    return filtered;
  }, [relocations, searchTerm, selectedStatus, startDate, endDate, sortOrder]);

  const filterRelocations = (relocations: RoomRelocation[]) => {
    return relocations.filter(relocation => {
      const matchesSearch = searchTerm === '' || 
        relocation.original_room?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        relocation.temporary_room?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || relocation.status === selectedStatus;

      const matchesDateRange = (!startDate || new Date(relocation.start_date) >= startDate) &&
                              (!endDate || new Date(relocation.end_date) <= endDate);

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  };

  const sortRelocations = (relocations: RoomRelocation[]) => {
    return [...relocations].sort((a, b) => {
      switch (sortOrder) {
        case 'date-asc':
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        case 'date-desc':
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        case 'duration-asc':
          return (new Date(a.end_date).getTime() - new Date(a.start_date).getTime()) -
                 (new Date(b.end_date).getTime() - new Date(b.start_date).getTime());
        case 'duration-desc':
          return (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) -
                 (new Date(a.end_date).getTime() - new Date(a.start_date).getTime());
        default:
          return 0;
      }
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filteredRelocations,
    sortOrder,
    setSortOrder,
  };
}
