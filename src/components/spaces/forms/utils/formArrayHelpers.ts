
import { Path, UseFormReturn } from "react-hook-form";
import { EditSpaceFormData, MaintenanceScheduleItem, EmergencyExit } from "../../schemas/editSpaceSchema";

type ArrayFieldName = keyof {
  [K in keyof EditSpaceFormData as EditSpaceFormData[K] extends any[] ? K : never]: EditSpaceFormData[K]
};

export function getArrayFieldValue<T extends MaintenanceScheduleItem[] | EmergencyExit[]>(
  form: UseFormReturn<EditSpaceFormData>,
  field: ArrayFieldName
): T {
  const value = form.watch(field as Path<EditSpaceFormData>);
  return (Array.isArray(value) ? value : []) as T;
}

export function updateArrayField<T extends MaintenanceScheduleItem[] | EmergencyExit[]>(
  form: UseFormReturn<EditSpaceFormData>,
  field: ArrayFieldName,
  newValue: T
) {
  form.setValue(field as Path<EditSpaceFormData>, newValue);
}

export function addArrayItem<T extends MaintenanceScheduleItem | EmergencyExit>(
  form: UseFormReturn<EditSpaceFormData>,
  field: ArrayFieldName,
  item: T
) {
  const currentValue = getArrayFieldValue(form, field);
  updateArrayField(form, field, [...currentValue, item]);
}

export function removeArrayItem(
  form: UseFormReturn<EditSpaceFormData>,
  field: ArrayFieldName,
  index: number
) {
  const currentValue = getArrayFieldValue(form, field);
  updateArrayField(form, field, currentValue.filter((_, i) => i !== index));
}
