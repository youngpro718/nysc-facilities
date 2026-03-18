import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const doorConnectionSchema = z.object({
  doorId: z.string().uuid(),
  accessType: z.enum(["standard", "secured", "emergency"]),
  direction: z.enum(["north", "south", "east", "west", "adjacent"])
});

type DoorConnectionFormData = z.infer<typeof doorConnectionSchema>;

interface DoorConnectionFormProps {
  selectedDoor: string;
  onDoorChange: (value: string) => void;
  onConnect: () => void;
  isLoading: boolean;
  availableDoors: Array<{ id: string; name: string; type: string }>;
}

export function DoorConnectionForm({
  selectedDoor,
  onDoorChange,
  onConnect,
  isLoading,
  availableDoors
}: DoorConnectionFormProps) {
  const form = useForm<DoorConnectionFormData>({
    resolver: zodResolver(doorConnectionSchema),
    defaultValues: {
      doorId: "",
      accessType: "standard",
      direction: "adjacent"
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onConnect)} className="space-y-4">
        <FormField
          control={form.control}
          name="doorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Door</FormLabel>
              <Select 
                value={selectedDoor} 
                onValueChange={(value) => {
                  onDoorChange(value);
                  field.onChange(value);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a door" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableDoors.map((door) => (
                    <SelectItem key={door.id} value={door.id}>
                      {door.name} ({door.type})
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
              <Select onValueChange={field.onChange} value={field.value}>
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
              <Select onValueChange={field.onChange} value={field.value}>
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

        <Button 
          type="submit"
          disabled={!selectedDoor || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Connect Door"
          )}
        </Button>
      </form>
    </Form>
  );
}