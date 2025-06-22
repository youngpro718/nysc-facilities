
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StatusEnum } from "../../rooms/types/roomEnums";

const editHallwaySchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["active", "inactive", "under_maintenance"]).default("active"),
  position: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
  }).default({ x: 0, y: 0 }),
  size: z.object({
    width: z.number().default(300),
    height: z.number().default(50),
  }).default({ width: 300, height: 50 }),
  rotation: z.number().default(0),
  properties: z.object({
    description: z.string().optional(),
  }).default({}),
});

type EditHallwayFormData = z.infer<typeof editHallwaySchema>;

interface EditHallwayFormProps {
  id: string;
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditHallwayForm({ id, initialData, onSuccess, onCancel }: EditHallwayFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<EditHallwayFormData>({
    resolver: zodResolver(editHallwaySchema),
    defaultValues: {
      name: initialData?.name || "",
      status: (initialData?.status as "active" | "inactive" | "under_maintenance") || "active",
      position: initialData?.position || { x: 0, y: 0 },
      size: initialData?.size || { width: 300, height: 50 },
      rotation: initialData?.rotation || 0,
      properties: {
        description: initialData?.properties?.description || initialData?.description || "",
      },
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditHallwayFormData) => {
      const { error } = await supabase
        .from("hallways")
        .update({
          name: data.name,
          status: data.status as StatusEnum,
          position: data.position,
          size: data.size,
          rotation: data.rotation,
          description: data.properties.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hallways"] });
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      toast.success("Hallway updated successfully");
      onSuccess();
    },
    onError: (error) => {
      console.error("Error updating hallway:", error);
      toast.error("Failed to update hallway");
    },
  });

  const onSubmit = (data: EditHallwayFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="Enter hallway name"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={form.watch("status")}
          onValueChange={(value: "active" | "inactive" | "under_maintenance") => 
            form.setValue("status", value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register("properties.description")}
          placeholder="Enter hallway description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position.x">Position X</Label>
          <Input
            id="position.x"
            type="number"
            {...form.register("position.x", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position.y">Position Y</Label>
          <Input
            id="position.y"
            type="number"
            {...form.register("position.y", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="size.width">Width</Label>
          <Input
            id="size.width"
            type="number"
            {...form.register("size.width", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="size.height">Height</Label>
          <Input
            id="size.height"
            type="number"
            {...form.register("size.height", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rotation">Rotation</Label>
        <Input
          id="rotation"
          type="number"
          {...form.register("rotation", { valueAsNumber: true })}
          placeholder="Rotation in degrees"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Updating..." : "Update Hallway"}
        </Button>
      </div>
    </form>
  );
}
