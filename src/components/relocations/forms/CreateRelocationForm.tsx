
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
  end_date: z.string().min(1, "End date is required"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
  relocation_type: z.enum(['emergency', 'maintenance', 'other', 'construction'])
    .default('maintenance'),
});

type FormData = z.infer<typeof createRelocationSchema>;

export function CreateRelocationForm() {
  const navigate = useNavigate();
  const { createRelocation, isCreating } = useRelocations();

  const form = useForm<FormData>({
    resolver: zodResolver(createRelocationSchema),
    defaultValues: {
      original_room_id: "",
      temporary_room_id: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      reason: "",
      notes: "",
      relocation_type: "maintenance",
    },
  });

  const onSubmit = async (data: FormData) => {
    await createRelocation({
      ...data,
      original_room_id: data.original_room_id,  // Ensure this is always set
      temporary_room_id: data.temporary_room_id,
      start_date: data.start_date,
      end_date: data.end_date,
      reason: data.reason,
      relocation_type: data.relocation_type,
      notes: data.notes
    });
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
          name="end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="relocation_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="emergency">Emergency</option>
                  <option value="construction">Construction</option>
                  <option value="other">Other</option>
                </select>
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
