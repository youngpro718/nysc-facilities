import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LockboxSlot } from "../types/LockboxTypes";
import { LockboxSearch } from "./LockboxSearch";
import { LockboxSlotDialog } from "./LockboxSlotDialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function LockboxView() {
  const [slots, setSlots] = useState<LockboxSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<LockboxSlot | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSlots = async () => {
    try {
      // Assuming one main lockbox for now as per requirement
      const { data, error } = await supabase
        .from('lockbox_slots')
        .select('*')
        .order('slot_number', { ascending: true });

      if (error) throw error;
      setSlots(data as LockboxSlot[]);
    } catch (error: any) {
      console.error('Error fetching lockbox slots:', error);
      toast.error("Failed to load lockbox data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    
    // Optional: Set up realtime subscription here
    const channel = supabase
      .channel('lockbox_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lockbox_slots' }, (payload) => {
        fetchSlots(); // Simplest way to keep sync
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  return (
    <div className="h-[calc(100vh-200px)]">
      <LockboxSearch slots={slots} onSlotClick={handleSlotClick} />
      
      <LockboxSlotDialog 
        slot={selectedSlot} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={fetchSlots}
      />
    </div>
  );
}
