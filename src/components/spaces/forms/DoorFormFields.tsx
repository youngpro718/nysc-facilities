
import { UseFormReturn } from "react-hook-form";
import { EditSpaceFormData } from "../schemas/editSpaceSchema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertCircle, Wrench, CalendarIcon } from "lucide-react";
import { BasicInfoTab } from "./door/BasicInfoTab";
import { SecurityTab } from "./door/SecurityTab";
import { MaintenanceTab } from "./door/MaintenanceTab";
import { HistoryTab } from "./door/HistoryTab";

interface DoorFormFieldsProps {
  form: UseFormReturn<EditSpaceFormData>;
}

export function DoorFormFields({ form }: DoorFormFieldsProps) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Basic Info
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="maintenance" className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Maintenance
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic">
        <BasicInfoTab form={form} />
      </TabsContent>

      <TabsContent value="security">
        <SecurityTab form={form} />
      </TabsContent>

      <TabsContent value="maintenance">
        <MaintenanceTab form={form} />
      </TabsContent>

      <TabsContent value="history">
        <HistoryTab form={form} />
      </TabsContent>
    </Tabs>
  );
}
