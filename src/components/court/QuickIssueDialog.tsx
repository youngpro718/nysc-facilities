import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export type QuickIssueCategory = "MAINTENANCE" | "LIGHTING" | "TECHNICAL";

interface QuickIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string | null; // unified room_id from court_rooms.room_id
  roomNumber?: string;
}

// Map high-level categories to existing issues.type values used elsewhere in the app
const CATEGORY_TO_TYPE: Record<QuickIssueCategory, string> = {
  MAINTENANCE: "GENERAL_REQUESTS",
  LIGHTING: "ELECTRICAL_NEEDS",
  TECHNICAL: "BUILDING_SYSTEMS",
};

export const QuickIssueDialog: React.FC<QuickIssueDialogProps> = ({ open, onOpenChange, roomId, roomNumber }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [category, setCategory] = useState<QuickIssueCategory>("MAINTENANCE");
  const [priority, setPriority] = useState<string>("medium");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const isDisabled = useMemo(() => !roomId || !title.trim(), [roomId, title]);

  const { mutate: createIssue, isPending } = useMutation({
    mutationFn: async () => {
      if (!roomId) throw new Error("Missing room id");
      const payload: any = {
        room_id: roomId,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status: "open",
        type: CATEGORY_TO_TYPE[category],
      };
      const { data, error } = await supabase.from("issues").insert(payload).select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      toast({ title: "Issue reported", description: `Created issue #${data?.id ?? ''}` });
      // Invalidate relevant dashboards so the new issue reflects immediately
      qc.invalidateQueries({ queryKey: ["interactive-operations"] });
      qc.invalidateQueries({ queryKey: ["assignment-stats"] });
      qc.invalidateQueries({ queryKey: ["quick-actions"] });
      qc.invalidateQueries(); // last-resort nudge
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setCategory("MAINTENANCE");
    },
    onError: (err: any) => {
      console.error("Quick issue creation failed", err);
      toast({ title: "Failed to create issue", description: String(err?.message || err), variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Report Issue {roomNumber ? `for Room ${roomNumber}` : ''}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!roomId && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
              Select a room first: open a room tile and choose “Report Issue…” so the issue can be associated with a room.
            </div>
          )}
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as QuickIssueCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="LIGHTING">Lighting</SelectItem>
                  <SelectItem value="TECHNICAL">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short issue title" />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" rows={4} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              {!title.trim() && <span>Title is required. </span>}
              {!roomId && <span>Room is required (open from a room).</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
              <Button onClick={() => createIssue()} disabled={isDisabled || isPending}>
                {isPending ? "Saving…" : "Create Issue"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
