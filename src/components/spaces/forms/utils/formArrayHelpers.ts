
import { UseFormReturn } from "react-hook-form";

export const getFormArray = <T>(form: UseFormReturn<T>, field: keyof T) => {
  const value = form.watch(field);
  return Array.isArray(value) ? value : [];
};

export const updateFormArray = <T>(
  form: UseFormReturn<T>,
  field: keyof T,
  callback: (array: any[]) => any[]
) => {
  const currentArray = getFormArray(form, field);
  form.setValue(field as any, callback(currentArray));
};
