
import { UseFormReturn } from "react-hook-form";
import { FormSpace } from "../types/formTypes";

export const getArrayFieldValue = <T extends any[]>(
  form: UseFormReturn<FormSpace>,
  field: keyof FormSpace,
  defaultValue: T = [] as unknown as T
): T => {
  const value = form.watch(field);
  return Array.isArray(value) ? value : defaultValue;
};

export const updateArrayField = <T extends any[]>(
  form: UseFormReturn<FormSpace>,
  field: keyof FormSpace,
  newValue: T
) => {
  form.setValue(field, newValue as any);
};

export const addArrayItem = <T extends any[]>(
  form: UseFormReturn<FormSpace>,
  field: keyof FormSpace,
  item: T[number]
) => {
  const currentValue = getArrayFieldValue<T>(form, field);
  updateArrayField(form, field, [...currentValue, item]);
};

export const removeArrayItem = <T extends any[]>(
  form: UseFormReturn<FormSpace>,
  field: keyof FormSpace,
  index: number
) => {
  const currentValue = getArrayFieldValue<T>(form, field);
  updateArrayField(form, field, currentValue.filter((_, i) => i !== index));
};
