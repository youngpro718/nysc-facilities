
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRelocation } from "../services/mutations/relocationMutations";

const createRelocationFormSchema = z.object({
  original_room_id: z.string().min(1, "Original Room ID is required"),
  temporary_room_id: z.string().min(1, "Temporary Room ID is required"),
  start_date: z.date(),
  end_date: z.date(),
  reason: z.string().optional(),
});

type CreateRelocationFormData = z.infer<typeof createRelocationFormSchema>;

interface CreateRelocationFormProps {
  onSuccess?: () => void;
}

export function CreateRelocationForm({ onSuccess }: CreateRelocationFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: CreateRelocationFormData) => {
      const formData = {
        original_room_id: data.original_room_id,
        temporary_room_id: data.temporary_room_id,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date.toISOString(),
        reason: data.reason || "",
        relocation_type: 'planned' as const,
      };
      return createRelocation(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      toast({
        title: "Success",
        description: "Relocation created successfully",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create relocation",
        variant: "destructive",
      });
    },
  });

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const form = useForm<CreateRelocationFormData>({
    resolver: zodResolver(createRelocationFormSchema),
    defaultValues: {
      original_room_id: "",
      temporary_room_id: "",
      start_date: new Date(),
      end_date: new Date(),
      reason: "",
    },
  });

  const onSubmit = (data: CreateRelocationFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="original_room_id">Original Room ID</Label>
          <Input id="original_room_id" type="text" placeholder="Original Room ID" {...form.register("original_room_id")} />
          {form.formState.errors.original_room_id && (
            <p className="text-sm text-red-500">{form.formState.errors.original_room_id.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="temporary_room_id">Temporary Room ID</Label>
          <Input id="temporary_room_id" type="text" placeholder="Temporary Room ID" {...form.register("temporary_room_id")} />
          {form.formState.errors.temporary_room_id && (
            <p className="text-sm text-red-500">{form.formState.errors.temporary_room_id.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? startDate.toLocaleDateString() : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    if (date) {
                      form.setValue("start_date", date);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? endDate.toLocaleDateString() : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date);
                    if (date) {
                      form.setValue("end_date", date);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason (Optional)</Label>
          <Input id="reason" type="text" placeholder="Reason for relocation" {...form.register("reason")} />
        </div>
        <Button 
          type="submit" 
          disabled={createMutation.isPending}
          className="w-full"
        >
          {createMutation.isPending ? "Creating..." : "Create Relocation"}
        </Button>
      </form>
    </Form>
  );
}
