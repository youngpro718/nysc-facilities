import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { RoomType, StorageType } from "../../rooms/types/RoomTypes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const roomTypes: { value: RoomType; label: string }[] = [
  { value: "courtroom", label: "Courtroom" },
  { value: "judges_chambers", label: "Judge's Chambers" },
  { value: "jury_room", label: "Jury Room" },
  { value: "conference_room", label: "Conference Room" },
  { value: "office", label: "Office" },
  { value: "filing_room", label: "Filing Room" },
  { value: "male_locker_room", label: "Male Locker Room" },
  { value: "female_locker_room", label: "Female Locker Room" },
  { value: "robing_room", label: "Robing Room" },
  { value: "stake_holder", label: "Stake Holder" },
  { value: "records_room", label: "Records Room" },
  { value: "administrative_office", label: "Administrative Office" },
  { value: "break_room", label: "Break Room" },
  { value: "it_room", label: "IT Room" },
  { value: "utility_room", label: "Utility Room" }
];

const storageTypes: { value: StorageType; label: string }[] = [
  { value: "file_storage", label: "File Storage" },
  { value: "equipment_storage", label: "Equipment Storage" },
  { value: "supply_storage", label: "Supply Storage" },
  { value: "evidence_storage", label: "Evidence Storage" },
  { value: "record_storage", label: "Record Storage" },
  { value: "general_storage", label: "General Storage" }
];

interface CreateRoomFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
  floorId: string;
}

export function CreateRoomFields({ form, floorId }: CreateRoomFieldsProps) {
  const [isRoomTypeOpen, setIsRoomTypeOpen] = useState(false);
  const [isStorageTypeOpen, setIsStorageTypeOpen] = useState(false);
  const [isParentRoomOpen, setIsParentRoomOpen] = useState(false);
  const isStorage = form.watch("isStorage");

  const { data: availableRooms } = useQuery({
    queryKey: ["available-rooms", floorId],
    queryFn: async () => {
      console.log("Fetching available rooms for floor:", floorId);
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, room_number")
        .eq("floor_id", floorId)
        .eq("status", "active")
        .order("room_number");

      if (error) throw error;
      return data;
    },
    enabled: !!floorId
  });

  return (
    <div className="space-y-4">
      {floorId && (
        <FormField
          control={form.control}
          name="parentRoomId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Room</FormLabel>
              <Popover open={isParentRoomOpen} onOpenChange={setIsParentRoomOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isParentRoomOpen}
                    className="w-full justify-between bg-background"
                  >
                    <span className={cn("truncate", !field.value && "text-muted-foreground")}>
                      {field.value
                        ? availableRooms?.find((room) => room.id === field.value)
                          ? `${availableRooms.find((room) => room.id === field.value)?.room_number} - ${availableRooms.find((room) => room.id === field.value)?.name}`
                          : "Select parent room"
                        : "Select parent room"}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search rooms..." />
                    <CommandList>
                      <CommandEmpty>No rooms found.</CommandEmpty>
                      <CommandGroup>
                        {availableRooms?.map((room) => (
                          <CommandItem
                            key={room.id}
                            value={`${room.room_number} ${room.name}`.toLowerCase()}
                            onSelect={() => {
                              form.setValue("parentRoomId", room.id);
                              setIsParentRoomOpen(false);
                            }}
                          >
                            {room.room_number} - {room.name}
                            {field.value === room.id && (
                              <Check className="ml-auto h-4 w-4" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="roomNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Room Number</FormLabel>
            <FormControl>
              <Input placeholder="Enter room number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="roomType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Room Type</FormLabel>
            <Popover open={isRoomTypeOpen} onOpenChange={setIsRoomTypeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isRoomTypeOpen}
                  className="w-full justify-between bg-background"
                >
                  <span className={cn("truncate", !field.value && "text-muted-foreground")}>
                    {field.value
                      ? roomTypes.find((type) => type.value === field.value)?.label
                      : "Select room type"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search room types..." />
                  <CommandList>
                    <CommandEmpty>No room type found.</CommandEmpty>
                    <CommandGroup>
                      {roomTypes.map((type) => (
                        <CommandItem
                          key={type.value}
                          value={type.value}
                          onSelect={() => {
                            form.setValue("roomType", type.value);
                            setIsRoomTypeOpen(false);
                          }}
                        >
                          {type.label}
                          {field.value === type.value && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
              <Textarea 
                placeholder="Enter description" 
                {...field} 
                className="min-h-[100px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isStorage"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Storage Room</FormLabel>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {isStorage && (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="storageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Type</FormLabel>
                <Popover open={isStorageTypeOpen} onOpenChange={setIsStorageTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-background"
                    >
                      <span className={cn("truncate", !field.value && "text-muted-foreground")}>
                        {field.value 
                          ? storageTypes.find(type => type.value === field.value)?.label
                          : "Select storage type"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search storage types..." />
                      <CommandList>
                        <CommandEmpty>No storage type found.</CommandEmpty>
                        <CommandGroup>
                          {storageTypes.map((type) => (
                            <CommandItem
                              key={type.value}
                              value={type.value}
                              onSelect={() => {
                                form.setValue("storageType", type.value);
                                setIsStorageTypeOpen(false);
                              }}
                            >
                              {type.label}
                              {field.value === type.value && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storageNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter any additional storage notes" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
