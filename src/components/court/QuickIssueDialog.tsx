import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
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

export type QuickIssueCategory = "MAINTENANCE" | "LIGHTING" | "TECHNICAL";

interface QuickIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string | null;
  roomNumber?: string;
}

// Map high-level categories to existing issues.type values
const CATEGORY_TO_TYPE: Record<QuickIssueCategory, string> = {
  MAINTENANCE: "GENERAL_REQUESTS",
  LIGHTING: "ELECTRICAL_NEEDS",
  TECHNICAL: "BUILDING_SYSTEMS",
};

const quickIssueSchema = z.object({
  category: z.enum(["MAINTENANCE", "LIGHTING", "TECHNICAL"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type QuickIssueFormData = z.infer<typeof quickIssueSchema>;

export const QuickIssueDialog: React.FC<QuickIssueDialogProps> = ({
  open,
  onOpenChange,
  roomId,
  roomNumber,
}) => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const form = useForm<QuickIssueFormData>({
    resolver: zodResolver(quickIssueSchema),
    defaultValues: {
      category: "MAINTENANCE",
      priority: "medium",
      title: "",
      description: "",
    },
  });

  const { mutate: createIssue, isPending } = useMutation({
    mutationFn: async (data: QuickIssueFormData) => {
      if (!roomId) throw new Error("Missing room id");
      const payload = {
        room_id: roomId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        priority: data.priority,
        status: "open",
        type: CATEGORY_TO_TYPE[data.category],
      };
      const { data: result, error } = await supabase
        .from("issues")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: async (data) => {
      toast({ title: "Issue reported", description: `Created issue #${data?.id ?? ""}` });
      qc.invalidateQueries({ queryKey: ["interactive-operations"] });
      qc.invalidateQueries({ queryKey: ["assignment-stats"] });
      qc.invalidateQueries({ queryKey: ["quick-actions"] });
      qc.invalidateQueries();
      form.reset();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to create issue",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuickIssueFormData) => {
    createIssue(data);
  };

  return (
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      title={`Report Issue${roomNumber ? ` for Room ${roomNumber}` : ""}`}
      description="Quickly report maintenance, lighting, or technical issues for this room."
      size="sm"
    >
      {!roomId && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2 mb-4">
          Select a room first: open a room tile and choose "Report Issue…" so the issue can be
          associated with a room.
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="LIGHTING">Lighting</SelectItem>
                    <SelectItem value="TECHNICAL">Technical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Short issue title" {...field} />
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
                  <Textarea placeholder="Optional details" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormButtons
            onCancel={() => onOpenChange(false)}
            isSubmitting={isPending}
            submitLabel="Create Issue"
            disabled={!roomId}
          />
        </form>
      </Form>
    </ModalFrame>
  );
};
