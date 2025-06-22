
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BasicInfoTab } from "./BasicInfoTab";
import { MaintenanceTab } from "./MaintenanceTab";
import { SafetyTab } from "./SafetyTab";
import { EmergencyTab } from "./EmergencyTab";

const hallwayFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.string(),
  position: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
  }).optional(),
  size: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  rotation: z.number().default(0),
  properties: z.object({
    description: z.string().optional(),
  }).optional(),
});

type HallwayFormData = z.infer<typeof hallwayFormSchema>;

interface EditHallwayFormProps {
  id: string;
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditHallwayForm({ id, initialData, onSuccess, onCancel }: EditHallwayFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<HallwayFormData>({
    resolver: zodResolver(hallwayFormSchema),
    defaultValues: {
      name: "",
      status: "active",
      position: { x: 0, y: 0 },
      size: { width: 300, height: 50 },
      rotation: 0,
      properties: {
        description: "",
      },
    },
  });

  useEffect(() => {
    if (initialData) {
      const safeData = {
        name: typeof initialData.name === 'string' ? initialData.name : "",
        status: typeof initialData.status === 'string' ? initialData.status : "active",
        position: initialData.position || { x: 0, y: 0 },
        size: initialData.size || { width: 300, height: 50 },
        rotation: typeof initialData.rotation === 'number' ? initialData.rotation : 0,
        properties: {
          description: typeof initialData.description === 'string' ? initialData.description : "",
        },
      };
      form.reset(safeData);
    }
  }, [initialData, form]);

  const updateHallwayMutation = useMutation({
    mutationFn: async (data: HallwayFormData) => {
      const safeName = typeof data.name === 'string' ? data.name : "";
      const safeStatus = typeof data.status === 'string' ? data.status : "active";
      const safeDescription = typeof data.properties?.description === 'string' ? data.properties.description : "";
      
      const { error } = await supabase
        .from("hallways")
        .update({
          name: safeName,
          status: safeStatus,
          position: data.position || { x: 0, y: 0 },
          size: data.size || { width: 300, height: 50 },
          rotation: data.rotation || 0,
          properties: { description: safeDescription },
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hallways"] });
      toast({
        title: "Success",
        description: "Hallway updated successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update hallway",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HallwayFormData) => {
    updateHallwayMutation.mutate(data);
  };

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "maintenance", label: "Maintenance" },
    { id: "safety", label: "Safety" },
    { id: "emergency", label: "Emergency" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {activeTab === "basic" && <BasicInfoTab form={form} />}
          {activeTab === "maintenance" && <MaintenanceTab form={form} />}
          {activeTab === "safety" && <SafetyTab form={form} />}
          {activeTab === "emergency" && <EmergencyTab form={form} />}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateHallwayMutation.isPending}>
            {updateHallwayMutation.isPending ? "Updating..." : "Update Hallway"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
