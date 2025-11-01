
export type SortOption = 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc';

export interface SpaceItem {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export function filterSpaces<T extends SpaceItem>(
  items: T[] | null,
  searchQuery: string,
  statusFilter: string
): T[] {
  if (!items) return [];
  
  return items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

export function sortSpaces<T extends SpaceItem>(
  items: T[],
  sortBy: SortOption
): T[] {
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'created_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'created_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default:
        return 0;
    }
  });
}
