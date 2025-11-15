
import { UseFormReturn } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Shield, Wrench, Home } from "lucide-react";
import { EditSpaceFormData } from "../schemas/editSpaceSchema";
import { BasicInfoTab } from "./hallway/BasicInfoTab";
import { SafetyTab } from "./hallway/SafetyTab";
import { EmergencyTab } from "./hallway/EmergencyTab";
import { MaintenanceTab } from "./hallway/MaintenanceTab";

interface HallwayFormFieldsProps {
  form: UseFormReturn<EditSpaceFormData>;
}

export function HallwayFormFields({ form }: HallwayFormFieldsProps) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Basic Info
        </TabsTrigger>
        <TabsTrigger value="safety" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Safety
        </TabsTrigger>
        <TabsTrigger value="emergency" className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Emergency
        </TabsTrigger>
        <TabsTrigger value="maintenance" className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Maintenance
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="mt-4">
        <BasicInfoTab form={form} />
      </TabsContent>

      <TabsContent value="safety" className="mt-4">
        <SafetyTab form={form} />
      </TabsContent>

      <TabsContent value="emergency" className="mt-4">
        <EmergencyTab form={form} />
      </TabsContent>

      <TabsContent value="maintenance" className="mt-4">
        <MaintenanceTab form={form} />
      </TabsContent>
    </Tabs>
  );
}
