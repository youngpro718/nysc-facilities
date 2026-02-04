import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ModalFrame } from "@/components/common/ModalFrame";
import { FormButtons } from "@/components/ui/form-buttons";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RoomOption {
  id: string;
  name: string | null;
  room_number: string | null;
  floor_id: string | null;
  floors?: { building_id: string | null } | null;
}

const reportIssueSchema = z.object({
  title: z.string().min(1, "Issue title is required"),
  description: z.string().optional(),
  space_type: z.enum(["courtroom", "room", "hallway", "door", "building"]),
  space_name: z.string().optional(),
  room_id: z.string().optional(),
  building_id: z.string().optional(),
  issue_type: z.string().min(1, "Please select an issue type"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  recurring_issue: z.boolean(),
});

type ReportIssueFormData = z.infer<typeof reportIssueSchema>;

export const ReportIssueDialog = ({ open, onOpenChange }: ReportIssueDialogProps) => {
  const queryClient = useQueryClient();

  const form = useForm<ReportIssueFormData>({
    resolver: zodResolver(reportIssueSchema),
    defaultValues: {
      title: "",
      description: "",
      space_type: "courtroom",
      space_name: "",
      room_id: "",
      building_id: "",
      issue_type: "",
      severity: "medium",
      recurring_issue: false,
    },
  });

  const spaceType = form.watch("space_type");

  const { data: rooms } = useQuery<RoomOption[]>({
    queryKey: ["unified-spaces-rooms-for-issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unified_spaces")
        .select("id, name, room_number, floor_id, floors(building_id)")
        .eq("space_type", "room")
        .order("room_number");
      if (error) throw error;
      return (data as unknown as RoomOption[]) || [];
    },
  });

  const onSubmit = async (data: ReportIssueFormData) => {
    try {
      const { error } = await supabase.from("issues").insert({
        title: data.title,
        description: data.description || null,
        type: data.issue_type,
        priority: data.severity === "critical" ? "urgent" : data.severity,
        status: "open",
        room_id: data.room_id || null,
        building_id: data.building_id || null,
      } as any);

      if (error) throw error;

      // Invalidate all issue-related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["issues"] }),
        queryClient.invalidateQueries({ queryKey: ["userIssues"] }),
        queryClient.invalidateQueries({ queryKey: ["roomIssues"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenanceIssues"] }),
        queryClient.invalidateQueries({ queryKey: ["adminIssues"] }),
        queryClient.invalidateQueries({ queryKey: ["court-issues"] }),
        queryClient.invalidateQueries({ queryKey: ["interactive-operations"] }),
        queryClient.invalidateQueries({ queryKey: ["quick-actions"] }),
        queryClient.invalidateQueries({ queryKey: ["assignment-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["courtroom-availability"] }),
      ]);

      toast.success("Issue reported", {
        description: "The maintenance issue has been reported successfully.",
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error reporting issue:", error);
      toast.error("Failed to report issue", { description: "Please try again." });
    }
  };

  const handleRoomSelect = (roomId: string) => {
    const selected = rooms?.find((r) => r.id === roomId);
    form.setValue("room_id", roomId);
    form.setValue("space_name", selected?.room_number || "");
    form.setValue("building_id", selected?.floors?.building_id || "");
  };

  return (
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Report Maintenance Issue"
      description="Provide details about the maintenance problem, including location and severity."
      size="md"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Title</FormLabel>
                <FormControl>
                  <Input placeholder="Brief description of the issue" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detailed description of the problem" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="space_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Space Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="courtroom">Courtroom</SelectItem>
                      <SelectItem value="room">Room</SelectItem>
                      <SelectItem value="hallway">Hallway</SelectItem>
                      <SelectItem value="door">Door</SelectItem>
                      <SelectItem value="building">Building</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {spaceType === "room" && rooms ? (
              <FormField
                control={form.control}
                name="room_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <Select onValueChange={handleRoomSelect} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.room_number} - {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="space_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Space Name/Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter space identifier (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="issue_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="structural">Structural</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severity</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="recurring_issue"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">This is a recurring issue</FormLabel>
              </FormItem>
            )}
          />

          <FormButtons
            onCancel={() => onOpenChange(false)}
            isSubmitting={form.formState.isSubmitting}
            submitLabel="Report Issue"
          />
        </form>
      </Form>
    </ModalFrame>
  );
};
