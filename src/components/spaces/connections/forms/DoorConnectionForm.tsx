// @ts-nocheck
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { BaseConnectionFormProps } from "../types/ConnectionTypes";
import { BaseFormField } from "./BaseConnectionForm";
import { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Lock } from "lucide-react";
import { Direction } from "../types/ConnectionTypes";

const doorConnectionSchema = z.object({
  doorId: z.string().uuid(),
  accessType: z.enum(["standard", "secured", "emergency"]),
  direction: z.enum(["north", "south", "east", "west", "adjacent"])
});

type DoorConnectionFormData = z.infer<typeof doorConnectionSchema>;

interface Space {
  id: string;
  name: string;
  type: string;
  security_level?: string;
}

interface DoorConnectionFormProps {
  form: UseFormReturn<Record<string, unknown>>;
  availableSpaces: Space[];
  isDisabled?: boolean;
}

export function DoorConnectionForm({
  form,
  availableSpaces,
  isDisabled
}: DoorConnectionFormProps) {
  // Filter spaces to only include doors with normalized type comparison
  const availableDoors = availableSpaces.filter(space => {
    const normalizedType = space.type.toLowerCase().replace(/_/g, '');
    return [
      'door',
      'secure',
      'entry',
      'gate',
      'portal',
      'access',
      'egress'
    ].includes(normalizedType);
  });

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="doorId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Door</FormLabel>
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
              disabled={isDisabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a door" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableDoors.map((door) => (
                  <SelectItem key={door.id} value={door.id} className="flex items-center gap-2">
                    {door.name}
                    {door.security_level === 'high' && (
                      <div className="flex items-center gap-2 text-yellow-500">
                        <Lock className="h-4 w-4" />
                        <span className="text-xs">Secure</span>
                      </div>
                    )}
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
        name="accessType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Access Type</FormLabel>
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
              disabled={isDisabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select access type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="secured">Secured</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
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
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
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
