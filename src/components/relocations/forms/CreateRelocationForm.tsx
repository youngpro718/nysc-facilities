
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRelocations } from "../hooks/useRelocations";
import { BuildingFloorNav } from "@/components/spaces/navigation/BuildingFloorNav";
import { useRoomsQuery } from "@/components/spaces/hooks/queries/useRoomsQuery";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { RoomSelectionSection } from "@/components/occupants/components/RoomSelectionSection";

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
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [originalSearchQuery, setOriginalSearchQuery] = useState("");
  const [temporarySearchQuery, setTemporarySearchQuery] = useState("");

  const { data: rooms, isLoading: isLoadingRooms } = useRoomsQuery({
    buildingId: selectedBuilding === 'all' ? undefined : selectedBuilding,
    floorId: selectedFloor === 'all' ? undefined : selectedFloor,
  });

  const filteredOriginalRooms = useMemo(() => 
    rooms?.filter(room => 
      room.name.toLowerCase().includes(originalSearchQuery.toLowerCase()) ||
      room.room_number.toLowerCase().includes(originalSearchQuery.toLowerCase()) ||
      room.floors?.buildings?.name?.toLowerCase().includes(originalSearchQuery.toLowerCase()) ||
      room.floors?.name?.toLowerCase().includes(originalSearchQuery.toLowerCase())
    ) || [], [rooms, originalSearchQuery]
  );

  const filteredTemporaryRooms = useMemo(() => 
    rooms?.filter(room => 
      room.name.toLowerCase().includes(temporarySearchQuery.toLowerCase()) ||
      room.room_number.toLowerCase().includes(temporarySearchQuery.toLowerCase()) ||
      room.floors?.buildings?.name?.toLowerCase().includes(temporarySearchQuery.toLowerCase()) ||
      room.floors?.name?.toLowerCase().includes(temporarySearchQuery.toLowerCase())
    ) || [], [rooms, temporarySearchQuery]
  );

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
    await createRelocation(data);
    navigate("/relocations");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <BuildingFloorNav
          selectedBuilding={selectedBuilding}
          selectedFloor={selectedFloor}
          onBuildingChange={setSelectedBuilding}
          onFloorChange={setSelectedFloor}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="original_room_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Room</FormLabel>
                <FormControl>
                  <RoomSelectionSection
                    searchQuery={originalSearchQuery}
                    onSearchChange={setOriginalSearchQuery}
                    selectedRoom={field.value}
                    onRoomChange={field.onChange}
                    filteredRooms={filteredOriginalRooms}
                    isLoadingRooms={isLoadingRooms}
                    label="Original Room"
                  />
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
                  <RoomSelectionSection
                    searchQuery={temporarySearchQuery}
                    onSearchChange={setTemporarySearchQuery}
                    selectedRoom={field.value}
                    onRoomChange={field.onChange}
                    filteredRooms={filteredTemporaryRooms}
                    isLoadingRooms={isLoadingRooms}
                    label="Temporary Room"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                      disabled={(date) =>
                        date < new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                      disabled={(date) =>
                        date < new Date(form.getValues("start_date"))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
