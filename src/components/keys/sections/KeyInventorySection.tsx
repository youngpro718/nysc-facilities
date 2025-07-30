
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KeyData, KeyFilterOptions, SortOption } from "../types/KeyTypes";
import { toast } from "sonner";
import { KeyFilters } from "../KeyFilters";
import { CreateKeyDialog } from "../CreateKeyDialog";
import { KeyInventoryHeader } from "./inventory/KeyInventoryHeader";
import { KeyInventoryTable } from "./inventory/KeyInventoryTable";
import { DeleteKeyDialog } from "./inventory/DeleteKeyDialog";

export function KeyInventorySection() {
  const [keyToDelete, setKeyToDelete] = useState<KeyData | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<KeyFilterOptions>({});
  const [sort, setSort] = useState<SortOption>({ field: 'name', direction: 'asc' });

  const { data: keys, isLoading, refetch } = useQuery({
    queryKey: ["keys-inventory", filters, sort],
    queryFn: async () => {
      try {
        // Get key data from base table
        let keysQuery = supabase
          .from("keys")
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
            captain_office_copy,
            captain_office_assigned_date,
            captain_office_notes,
            created_at,
            updated_at
          `);

        // Apply filters
        if (filters.type && filters.type !== 'all_types') {
          keysQuery = keysQuery.eq('type', filters.type);
        }
        
        if (filters.captainOfficeCopy && filters.captainOfficeCopy !== 'all') {
          keysQuery = keysQuery.eq('captain_office_copy', filters.captainOfficeCopy === 'has_copy');
        }
        
        // Apply sorting
        keysQuery = keysQuery.order(sort.field, { ascending: sort.direction === 'asc' });

        const { data: keysData, error: keysError } = await keysQuery;

        if (keysError) {
          console.error("Error fetching keys:", keysError);
          throw keysError;
        }

        // Get assignment statistics from key_assignments table
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("key_assignments")
          .select(`
            key_id,
            status
          `);

        if (assignmentError) {
          console.error("Error fetching assignments:", assignmentError);
          // Don't throw, just continue without assignment data
        }

        // Calculate assignment statistics
        const assignmentStats = assignmentData?.reduce((acc, assignment) => {
          const keyId = assignment.key_id;
          if (!acc[keyId]) {
            acc[keyId] = { active_assignments: 0, returned_assignments: 0, lost_count: 0 };
          }
          
          if (assignment.status === 'assigned') {
            acc[keyId].active_assignments++;
          } else if (assignment.status === 'returned') {
            acc[keyId].returned_assignments++;
          } else if (assignment.status === 'lost') {
            acc[keyId].lost_count++;
          }
          
          return acc;
        }, {} as Record<string, any>) || {};

        // Merge the data
        const mergedData = keysData?.map(key => {
          const stats = assignmentStats[key.id] || { active_assignments: 0, returned_assignments: 0, lost_count: 0 };
          return {
            ...key,
            active_assignments: stats.active_assignments,
            returned_assignments: stats.returned_assignments,
            lost_count: stats.lost_count,
            assigned_count: stats.active_assignments,
            stock_status: key.status
          };
        }) || [];

        return mergedData as KeyData[];
      } catch (error: any) {
        console.error("Error in query:", error);
        toast.error("Failed to fetch keys inventory");
        return [];
      }
    },
    retry: 1,
    retryDelay: 1000
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
      console.error("Error deleting key:", error);
      toast.error("Error deleting key: " + (error.message || "Unknown error"));
    } finally {
      setKeyToDelete(null);
    }
  };

  const handleToggleCaptainOfficeCopy = async (keyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('keys')
        .update({
          captain_office_copy: !currentStatus,
          captain_office_assigned_date: !currentStatus ? new Date().toISOString() : null,
          captain_office_notes: !currentStatus ? 'Assigned to Captain\'s Office' : null
        })
        .eq('id', keyId);

      if (error) {
        toast.error("Error updating captain's office status: " + error.message);
        return;
      }

      toast.success(!currentStatus ? 
        "Key marked as given to Captain's Office" : 
        "Key removed from Captain's Office"
      );
      refetch();
    } catch (error: any) {
      console.error("Error updating captain's office status:", error);
      toast.error("Error updating captain's office status");
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
        onToggleCaptainOfficeCopy={handleToggleCaptainOfficeCopy}
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
