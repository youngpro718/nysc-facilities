
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRelocations } from "../hooks/useRelocations";

const createRelocationSchema = z.object({
  original_room_id: z.string().min(1, "Original room is required"),
  temporary_room_id: z.string().min(1, "Temporary room is required"),
  start_date: z.string().min(1, "Start date is required"),
  expected_end_date: z.string().optional(),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

type CreateRelocationFormData = z.infer<typeof createRelocationSchema>;

export function CreateRelocationForm() {
  const navigate = useNavigate();
  const { createRelocation, isCreating } = useRelocations();

  const form = useForm<CreateRelocationFormData>({
    resolver: zodResolver(createRelocationSchema),
    defaultValues: {
      original_room_id: "",
      temporary_room_id: "",
      start_date: new Date().toISOString().split('T')[0],
      reason: "",
      notes: "",
    },
  });

  const onSubmit = async (data: CreateRelocationFormData) => {
    await createRelocation(data);
    navigate("/relocations");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="original_room_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Original Room</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Select original room" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="temporary_room_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temporary Room</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Select temporary room" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expected_end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected End Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter reason for relocation" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Additional notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/relocations")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Relocation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
