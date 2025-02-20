
import { Path, UseFormReturn } from "react-hook-form";
import { EditSpaceFormData } from "../../schemas/editSpaceSchema";

export function getArrayFieldValue<T>(
  form: UseFormReturn<EditSpaceFormData>,
  field: keyof EditSpaceFormData
): T[] {
  const value = form.watch(field as Path<EditSpaceFormData>);
  return (Array.isArray(value) ? value : []) as T[];
}

export function updateArrayField<T>(
  form: UseFormReturn<EditSpaceFormData>,
  field: keyof EditSpaceFormData,
  newValue: T[]
) {
  form.setValue(field as Path<EditSpaceFormData>, newValue);
}

export function addArrayItem<T>(
  form: UseFormReturn<EditSpaceFormData>,
  field: keyof EditSpaceFormData,
  item: T
) {
  const currentValue = getArrayFieldValue<T>(form, field);
  updateArrayField(form, field, [...currentValue, item]);
}

export function removeArrayItem<T>(
  form: UseFormReturn<EditSpaceFormData>,
  field: keyof EditSpaceFormData,
  index: number
) {
  const currentValue = getArrayFieldValue<T>(form, field);
  updateArrayField(form, field, currentValue.filter((_, i) => i !== index));
}
