
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
import { ParentRoomField } from "../room/ParentRoomField";
import { cn } from "@/lib/utils";
import { useState } from "react";

const roomTypes = [
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

interface CreateRoomFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
  floorId: string;
}

export function CreateRoomFields({ form, floorId }: CreateRoomFieldsProps) {
  const [isRoomTypeOpen, setIsRoomTypeOpen] = useState(false);
  const isStorage = form.watch("isStorage");

  return (
    <div className="space-y-4">
      {floorId && <ParentRoomField form={form} floorId={floorId} />}

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
                          onSelect={(value) => {
                            form.setValue("roomType", value);
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-background"
                    >
                      <span className={cn("truncate", !field.value && "text-muted-foreground")}>
                        {field.value ? field.value.replace(/_/g, ' ') : "Select storage type"}
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
                          {["file_storage", "equipment_storage", "supply_storage", 
                            "evidence_storage", "record_storage", "general_storage"].map((type) => (
                            <CommandItem
                              key={type}
                              value={type}
                              onSelect={(value) => {
                                form.setValue("storageType", value);
                              }}
                            >
                              {type.replace(/_/g, ' ')}
                              {field.value === type && (
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
