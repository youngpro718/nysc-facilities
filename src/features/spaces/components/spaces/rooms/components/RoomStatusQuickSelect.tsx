import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errorUtils";

type RoomStatus = "active" | "inactive" | "under_maintenance";

const STATUS_LABEL: Record<RoomStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  under_maintenance: "Under maintenance",
};

interface RoomStatusQuickSelectProps {
  roomId: string;
  status: string;
  /** Without edit rights this renders as the plain read-only badge. */
  canEdit: boolean;
}

/**
 * One-tap room status change from the room card — no trip into the edit
 * form just to mark a room inactive or under maintenance.
 */
export function RoomStatusQuickSelect({ roomId, status, canEdit }: RoomStatusQuickSelectProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (next: RoomStatus) => {
      const { error } = await supabase.from("rooms").update({ status: next }).eq("id", roomId);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(`Room marked ${STATUS_LABEL[next].toLowerCase()}`);
    },
    onError: (err) => {
      toast.error(`Status change failed: ${getErrorMessage(err)}`);
    },
  });

  const current = (status as RoomStatus) in STATUS_LABEL ? (status as RoomStatus) : "active";

  if (!canEdit) {
    return (
      <Badge variant={current === "active" ? "default" : "destructive"} className="capitalize">
        {STATUS_LABEL[current]}
      </Badge>
    );
  }

  return (
    <Select
      value={current}
      onValueChange={(v) => mutation.mutate(v as RoomStatus)}
      disabled={mutation.isPending}
    >
      <SelectTrigger
        className="h-7 w-auto gap-1 rounded-full border-none px-0 py-0 shadow-none focus:ring-1"
        aria-label="Change room status"
        onClick={(e) => e.stopPropagation()}
      >
        <Badge
          variant={current === "active" ? "default" : "destructive"}
          className="capitalize cursor-pointer"
        >
          {STATUS_LABEL[current]}
        </Badge>
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
        <SelectItem value="under_maintenance">Under maintenance</SelectItem>
      </SelectContent>
    </Select>
  );
}
