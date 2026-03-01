import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface MaintenanceShutdownSectionProps {
  courtRoomId: string | null | undefined;
}

export const MaintenanceShutdownSection = ({ courtRoomId }: MaintenanceShutdownSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clearing, setClearing] = useState(false);

  const { data: shutdowns, isLoading } = useQuery({
    queryKey: ["room-shutdowns-detail", courtRoomId],
    queryFn: async () => {
      if (!courtRoomId) return [];
      const { data, error } = await supabase
        .from("room_shutdowns")
        .select("id, reason, status, start_date, end_date")
        .eq("court_room_id", courtRoomId)
        .in("status", ["scheduled", "in_progress"]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!courtRoomId,
  });

  const clearShutdown = async (shutdownId: string) => {
    setClearing(true);
    try {
      const { error } = await supabase
        .from("room_shutdowns")
        .update({ status: "completed" })
        .eq("id", shutdownId);
      if (error) throw error;
      toast({ title: "Shutdown cleared", description: "Maintenance status has been resolved." });
      queryClient.invalidateQueries({ queryKey: ["room-shutdowns-detail", courtRoomId] });
      queryClient.invalidateQueries({ queryKey: ["room-shutdowns-active"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setClearing(false);
    }
  };

  if (isLoading || !shutdowns?.length) return null;

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
      <div className="flex items-center gap-2 text-destructive text-sm font-medium">
        <AlertTriangle className="h-4 w-4" />
        Active Shutdown{shutdowns.length > 1 ? "s" : ""}
      </div>
      {shutdowns.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="destructive" className="text-xs">{s.status}</Badge>
            <span className="text-muted-foreground">{s.reason || "No reason given"}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs shrink-0"
            disabled={clearing}
            onClick={() => clearShutdown(s.id)}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      ))}
    </div>
  );
};
