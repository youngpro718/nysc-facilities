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
import { ConnectionFields } from "./ConnectionFields";

const roomTypes: { value: RoomType; label: string }[] = [
  { value: RoomType.COURTROOM, label: "Courtroom" },
  { value: RoomType.JUDGES_CHAMBERS, label: "Judge's Chambers" },
  { value: RoomType.JURY_ROOM, label: "Jury Room" },
  { value: RoomType.CONFERENCE_ROOM, label: "Conference Room" },
  { value: RoomType.OFFICE, label: "Office" },
  { value: RoomType.FILING_ROOM, label: "Filing Room" },
  { value: RoomType.MALE_LOCKER_ROOM, label: "Male Locker Room" },
  { value: RoomType.FEMALE_LOCKER_ROOM, label: "Female Locker Room" },
  { value: RoomType.ROBING_ROOM, label: "Robing Room" },
  { value: RoomType.STAKE_HOLDER, label: "Stake Holder" },
  { value: RoomType.RECORDS_ROOM, label: "Records Room" },
  { value: RoomType.ADMINISTRATIVE_OFFICE, label: "Administrative Office" },
  { value: RoomType.BREAK_ROOM, label: "Break Room" },
  { value: RoomType.IT_ROOM, label: "IT Room" },
  { value: RoomType.UTILITY_ROOM, label: "Utility Room" }
];

const storageTypes: { value: StorageType; label: string }[] = [
  { value: StorageType.FILE_STORAGE, label: "File Storage" },
  { value: StorageType.EQUIPMENT_STORAGE, label: "Equipment Storage" },
  { value: StorageType.SUPPLY_STORAGE, label: "Supply Storage" },
  { value: StorageType.EVIDENCE_STORAGE, label: "Evidence Storage" },
  { value: StorageType.RECORD_STORAGE, label: "Record Storage" },
  { value: StorageType.GENERAL_STORAGE, label: "General Storage" }
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

      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-4">Space Connections</h3>
        <ConnectionFields form={form} floorId={floorId} />
      </div>
    </div>
  );
}
