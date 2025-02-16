import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const hallwayConnectionSchema = z.object({
  hallwayId: z.string().uuid(),
  connectionType: z.enum(["direct", "door", "secured"]),
  position: z.enum(["start", "middle", "end", "adjacent"])
});

type HallwayConnectionFormData = z.infer<typeof hallwayConnectionSchema>;

interface HallwayConnectionFormProps {
  selectedHallway: string;
  onHallwayChange: (value: string) => void;
  onConnect: () => void;
  isLoading: boolean;
  availableHallways: Array<{ id: string; name: string }>;
}

export function HallwayConnectionForm({
  selectedHallway,
  onHallwayChange,
  onConnect,
  isLoading,
  availableHallways
}: HallwayConnectionFormProps) {
  const form = useForm<HallwayConnectionFormData>({
    resolver: zodResolver(hallwayConnectionSchema),
    defaultValues: {
      hallwayId: "",
      connectionType: "direct",
      position: "adjacent"
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onConnect)} className="space-y-4">
        <FormField
          control={form.control}
          name="hallwayId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Hallway</FormLabel>
              <Select 
                value={selectedHallway} 
                onValueChange={(value) => {
                  onHallwayChange(value);
                  field.onChange(value);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hallway" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableHallways.map((hallway) => (
                    <SelectItem key={hallway.id} value={hallway.id}>
                      {hallway.name}
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
          name="connectionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Connection Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select connection type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="door">Door</SelectItem>
                  <SelectItem value="secured">Secured</SelectItem>
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="start">Start</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="end">End</SelectItem>
                  <SelectItem value="adjacent">Adjacent</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit"
          disabled={!selectedHallway || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Connect to Hallway"
          )}
        </Button>
      </form>
    </Form>
  );
}