
import { UseFormReturn, Path, PathValue } from "react-hook-form";

export const getFormArray = <T>(form: UseFormReturn<T>, field: Path<T>) => {
  const value = form.watch(field);
  return Array.isArray(value) ? value : [];
};

export const updateFormArray = <T>(
  form: UseFormReturn<T>,
  field: Path<T>,
  callback: (array: any[]) => any[]
) => {
  const currentArray = getFormArray(form, field);
  form.setValue(field, callback(currentArray) as PathValue<T, Path<T>>);
};
