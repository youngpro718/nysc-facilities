import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officeName?: string; // defaults to Captain's Office
}

export default function AllocateElevatorCardsToOfficeDialog({ open, onOpenChange, officeName = "Captain's Office" }: Props) {
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch the single elevator card pool key
  const { data: cardKey, isLoading: loadingKey } = useQuery({
    queryKey: ["elevator-card-key"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("keys")
        .select("id, name, available_quantity")
        .eq("is_elevator_card", true)
        .limit(1)
        .single();
      if (error) throw error;
      return (data as any);
    },
    enabled: open,
  });

  // Fetch current office holdings
  const { data: holdings, isLoading: loadingHoldings, refetch: refetchHoldings } = useQuery({
    queryKey: ["office-card-holdings", officeName, cardKey?.id],
    queryFn: async () => {
      if (!cardKey?.id) return null;
      const { data, error } = await (supabase as any)
        .from("v_office_elevator_card_holdings")
        .select("key_id, office_name, quantity_held")
        .eq("office_name", officeName)
        .eq("key_id", cardKey.id)
        .maybeSingle();
      if (error) throw error;
      return (data as any);
    },
    enabled: open && !!cardKey?.id,
  });

  useEffect(() => {
    if (!open) {
      setQuantity(1);
      setNotes("");
    }
  }, [open]);

  const currentHeld = (holdings as any)?.quantity_held ?? 0;

  async function onAllocate() {
    if (!cardKey?.id) return;
    if (quantity <= 0) {
      toast.error("Quantity must be at least 1");
      return;
    }
    if (cardKey.available_quantity < quantity) {
      toast.error(`Insufficient stock. Available: ${cardKey.available_quantity}`);
      return;
    }

    setSubmitting(true);
    try {
      // Narrow-cast supabase to any to avoid TS RPC typing issues
      const { error } = await (supabase as any).rpc("fn_allocate_elevator_cards_to_office", {
        p_key_id: cardKey.id,
        p_quantity: quantity,
        p_office_name: officeName,
        p_notes: notes || null,
      });
      if (error) throw error;
      toast.success(`Allocated ${quantity} card${quantity > 1 ? "s" : ""} to ${officeName}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["elevator-card-key"] }),
        queryClient.invalidateQueries({ queryKey: ["office-card-holdings"] }),
        refetchHoldings(),
      ]);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to allocate cards");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Allocate Elevator Cards to {officeName}</DialogTitle>
          <DialogDescription>
            Record allocations to track how many cards are held by the office. Stock will decrease accordingly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border p-3 text-sm flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="font-medium">Elevator Card Pool</div>
              <div className="text-muted-foreground">
                {loadingKey ? "Loading..." : cardKey ? `${cardKey.name} — Available: ${cardKey.available_quantity}` : "No elevator card pool found"}
              </div>
              <div className="text-muted-foreground">
                Current held by {officeName}: {loadingHoldings ? "…" : currentHeld}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to allocate</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || "1", 10)))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason, request details, etc." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={onAllocate} disabled={submitting || loadingKey || !cardKey}>
              {submitting ? "Allocating..." : "Allocate"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
