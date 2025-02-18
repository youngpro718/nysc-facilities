
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KeyData } from "../types/KeyTypes";
import { toast } from "sonner";
import { KeyFilters, SortOption } from "../KeyFilters";
import { CreateKeyDialog } from "../CreateKeyDialog";
import { KeyInventoryHeader } from "./inventory/KeyInventoryHeader";
import { KeyInventoryTable } from "./inventory/KeyInventoryTable";
import { DeleteKeyDialog } from "./inventory/DeleteKeyDialog";

export function KeyInventorySection() {
  const [keyToDelete, setKeyToDelete] = useState<KeyData | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<KeyFilters>({});
  const [sort, setSort] = useState<SortOption>({ field: 'name', direction: 'asc' });

  const { data: keys, isLoading, refetch } = useQuery({
    queryKey: ["keys-inventory", filters, sort],
    queryFn: async () => {
      let query = supabase
        .from("key_inventory_view")
        .select(`
          id,
          name,
          type,
          status,
          total_quantity,
          available_quantity,
          is_passkey,
          key_scope,
          properties,
          location_data,
          active_assignments,
          returned_assignments,
          lost_count
        `);

      // Apply filters
      if (filters.type && filters.type !== 'all_types') {
        query = query.eq('type', filters.type);
      }
      if (filters.status && filters.status !== 'all_statuses') {
        query = query.eq('status', filters.status);
      }
      // Use location_data for building filter
      if (filters.building_id && filters.building_id !== 'all_buildings') {
        query = query.contains('location_data', { building_id: filters.building_id });
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching keys:", error);
        throw error;
      }

      return data as KeyData[];
    },
  });

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    try {
      const { error } = await supabase.rpc('safely_delete_key', {
        key_id_to_delete: keyToDelete.id
      });

      if (error) {
        if (error.message.includes('active assignments')) {
          toast.error("Cannot delete key with active assignments");
        } else {
          toast.error("Error deleting key: " + error.message);
        }
        return;
      }

      toast.success("Key deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error("Error deleting key: " + error.message);
    } finally {
      setKeyToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <KeyInventoryHeader onAddKey={() => setCreateDialogOpen(true)} />

      <KeyFilters
        onFilterChange={setFilters}
        onSortChange={setSort}
      />

      <KeyInventoryTable 
        keys={keys || []} 
        onDeleteKey={setKeyToDelete}
      />

      <CreateKeyDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />

      <DeleteKeyDialog
        keyToDelete={keyToDelete}
        onOpenChange={() => setKeyToDelete(null)}
        onConfirmDelete={handleDeleteKey}
      />
    </div>
  );
}
