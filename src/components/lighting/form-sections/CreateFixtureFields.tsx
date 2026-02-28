
import { UseFormReturn } from "react-hook-form";
import { LightingFixtureFormData } from "../schemas/lightingSchema";
import { BasicSettingsFields } from "./BasicSettingsFields";
import { TechnicalFields } from "./TechnicalFields";
import { StatusAndMaintenanceFields } from "./StatusAndMaintenanceFields";
import { ElectricalIssuesFields } from "./ElectricalIssuesFields";
import { ZoneField } from "./ZoneField";

interface CreateFixtureFieldsProps {
  form: UseFormReturn<LightingFixtureFormData>;
  zones?: Array<{ id: string; name: string }>;
  onSpaceOrPositionChange?: () => void;
}

export function CreateFixtureFields({ form, zones, onSpaceOrPositionChange }: CreateFixtureFieldsProps) {
  return (
    <div className="space-y-6">
      <BasicSettingsFields 
        form={form} 
        onSpaceOrPositionChange={onSpaceOrPositionChange} 
      />
      
      <TechnicalFields form={form} />
      
      <StatusAndMaintenanceFields form={form} />
      
      <ElectricalIssuesFields form={form} />
      
      <ZoneField form={form} zones={zones} />
    </div>
  );
}
