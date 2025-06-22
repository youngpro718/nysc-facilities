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
import { createRelocation } from "../services/relocationService";

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
    mutationFn: createRelocation,
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

  const [date, setDate] = useState<Date | undefined>(undefined);

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
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? new Date(date).toLocaleDateString() : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.getValues("start_date")}
                  onSelect={(date) => {
                    form.setValue("start_date", date || new Date());
                    setDate(date);
                  }}
                  disabled={(date) =>
                    date > new Date()
                  }
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
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? new Date(date).toLocaleDateString() : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.getValues("end_date")}
                  onSelect={(date) => {
                    form.setValue("end_date", date || new Date());
                    setDate(date);
                  }}
                  disabled={(date) =>
                    date > new Date()
                  }
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
