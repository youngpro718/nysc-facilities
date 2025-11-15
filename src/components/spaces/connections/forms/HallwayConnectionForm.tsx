import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { BaseConnectionFormProps } from "../types/ConnectionTypes";
import { BaseFormField } from "./BaseConnectionForm";
import { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Direction, Position } from "../types/ConnectionTypes";

interface Space {
  id: string;
  name: string;
  type: string;
  section?: string;
}

interface HallwayConnectionFormProps {
  form: UseFormReturn<any>;
  availableSpaces: Space[];
  isDisabled?: boolean;
}

export function HallwayConnectionForm({
  isDisabled,
  availableSpaces,
  form
}: HallwayConnectionFormProps) {
  // Filter spaces to only include hallways with normalized type comparison
  const availableHallways = availableSpaces.filter(space => {
    const normalizedType = space.type.toLowerCase().replace(/_/g, '');
    return [
      'hallway',
      'corridor',
      'public_main',
      'publicmain',
      'main'
    ].includes(space.type.toLowerCase());  // Don't normalize the type for public_main
  });

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="hallwayId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Hallway</FormLabel>
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
              disabled={isDisabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a hallway" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableHallways.map((hallway) => (
                  <SelectItem key={hallway.id} value={hallway.id}>
                    {hallway.name} {hallway.section ? `(${hallway.section})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="position"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Position</FormLabel>
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
              disabled={isDisabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="start">Start</SelectItem>
                <SelectItem value="middle">Middle</SelectItem>
                <SelectItem value="end">End</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="direction"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Direction</FormLabel>
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
              disabled={isDisabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="left_of_hallway">Left of Hallway</SelectItem>
                <SelectItem value="right_of_hallway">Right of Hallway</SelectItem>
                <SelectItem value="adjacent">Adjacent</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
