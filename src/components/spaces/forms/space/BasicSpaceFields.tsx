
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface BasicSpaceFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
}

export function BasicSpaceFields({ form }: BasicSpaceFieldsProps) {
  const [isFloorOpen, setIsFloorOpen] = useState(false);

  const { data: floors } = useQuery({
    queryKey: ["floors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("floors")
        .select(`
          id,
          name,
          floor_number,
          buildings (
            id,
            name
          )
        `)
        .order('floor_number');
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="room">Room</SelectItem>
                <SelectItem value="hallway">Hallway</SelectItem>
                <SelectItem value="door">Door</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="floorId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Floor</FormLabel>
            <Popover open={isFloorOpen} onOpenChange={setIsFloorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isFloorOpen}
                  className="w-full justify-between"
                >
                  <span className={cn("truncate", !field.value && "text-muted-foreground")}>
                    {field.value
                      ? floors?.find(f => f.id === field.value)
                        ? `${floors.find(f => f.id === field.value)?.buildings.name} - Floor ${floors.find(f => f.id === field.value)?.floor_number} (${floors.find(f => f.id === field.value)?.name})`
                        : "Select a floor"
                      : "Select a floor"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search floors..." />
                  <CommandList>
                    <CommandEmpty>No floor found.</CommandEmpty>
                    <CommandGroup>
                      {floors?.map((floor) => (
                        <CommandItem
                          key={floor.id}
                          value={`${floor.buildings.name} ${floor.name} ${floor.floor_number}`.toLowerCase()}
                          onSelect={() => {
                            form.setValue("floorId", floor.id);
                            setIsFloorOpen(false);
                          }}
                        >
                          {floor.buildings.name} - Floor {floor.floor_number} ({floor.name})
                          {field.value === floor.id && (
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
    </div>
  );
}
