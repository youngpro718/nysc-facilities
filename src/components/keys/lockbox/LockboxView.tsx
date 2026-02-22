import { useState, useEffect } from "react";
import { logger } from '@/lib/logger';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { LockboxSlot, LockboxWithSlotCount } from "../types/LockboxTypes";
import { LockboxSearch } from "./LockboxSearch";
import { LockboxSlotDialog } from "./LockboxSlotDialog";
import { LockboxSelector } from "./LockboxSelector";
import { CreateLockboxDialog } from "./CreateLockboxDialog";
import { AddSlotDialog } from "./AddSlotDialog";
import { PrintLockboxReference } from "./PrintLockboxReference";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LockboxView() {
  const [slots, setSlots] = useState<LockboxSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<LockboxSlot | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLockboxId, setSelectedLockboxId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addSlotDialogOpen, setAddSlotDialogOpen] = useState(false);

  // Fetch all lockboxes with slot counts
  const { data: lockboxes, refetch: refetchLockboxes } = useQuery({
    queryKey: ["lockboxes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lockboxes')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get slot counts for each lockbox
      const lockboxesWithCounts = await Promise.all(
        (data || []).map(async (lockbox) => {
          const { data: slots, error: slotsError } = await supabase
            .from('lockbox_slots')
            .select('status')
            .eq('lockbox_id', lockbox.id);

          if (slotsError) throw slotsError;

          return {
            ...lockbox,
            total_slots: slots.length,
            available_slots: slots.filter(s => s.status === 'in_box').length,
            checked_out_slots: slots.filter(s => s.status === 'checked_out').length,
          } as LockboxWithSlotCount;
        })
      );

      return lockboxesWithCounts;
    },
  });

  // Auto-select first lockbox if none selected
  useEffect(() => {
    if (lockboxes && lockboxes.length > 0 && !selectedLockboxId) {
      setSelectedLockboxId(lockboxes[0].id);
    }
  }, [lockboxes, selectedLockboxId]);

  const fetchSlots = async () => {
    if (!selectedLockboxId) {
      setSlots([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('lockbox_slots')
        .select('*')
        .eq('lockbox_id', selectedLockboxId)
        .order('slot_number', { ascending: true });

      if (error) throw error;
      setSlots(data as LockboxSlot[]);
    } catch (error) {
      logger.error('Error fetching lockbox slots:', error);
      toast.error("Failed to load lockbox data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    
    // Set up realtime subscriptions for both lockboxes and slots
    const channel = supabase
      .channel('lockbox_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lockbox_slots' }, () => {
        fetchSlots();
        refetchLockboxes();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lockboxes' }, () => {
        refetchLockboxes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLockboxId]);

  const handleSlotClick = (slot: LockboxSlot) => {
    setSelectedSlot(slot);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleCreateSuccess = () => {
    refetchLockboxes();
  };

  const handleAddSlotSuccess = () => {
    fetchSlots();
    refetchLockboxes();
  };

  const selectedLockbox = lockboxes?.find(lb => lb.id === selectedLockboxId);

  return (
    <div className="space-y-4">
      <LockboxSelector 
        lockboxes={lockboxes || []}
        selectedLockboxId={selectedLockboxId}
        onSelectLockbox={setSelectedLockboxId}
        onCreateNew={() => setCreateDialogOpen(true)}
        isLoading={isLoading}
      />

      {selectedLockboxId && selectedLockbox && (
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setAddSlotDialogOpen(true)} 
            variant="outline" 
            size="sm"
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Key Slot</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <PrintLockboxReference lockbox={selectedLockbox} slots={slots} />
        </div>
      )}

      {selectedLockboxId ? (
        <div className="min-h-[300px] max-h-[calc(100vh-350px)] sm:max-h-[calc(100vh-400px)]">
          <LockboxSearch 
            slots={slots} 
            onSlotClick={handleSlotClick}
            lockboxName={selectedLockbox?.name}
          />
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Please select or create a lockbox to view slots</p>
        </div>
      )}
      
      <LockboxSlotDialog 
        slot={selectedSlot} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={fetchSlots}
        lockboxName={selectedLockbox?.name}
      />

      <CreateLockboxDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedLockboxId && (
        <AddSlotDialog
          lockboxId={selectedLockboxId}
          lockboxName={selectedLockbox?.name}
          existingSlotCount={slots.length}
          open={addSlotDialogOpen}
          onOpenChange={setAddSlotDialogOpen}
          onSuccess={handleAddSlotSuccess}
        />
      )}
    </div>
  );
}
