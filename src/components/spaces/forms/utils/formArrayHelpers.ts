
import { Path, PathValue, UseFormReturn } from "react-hook-form";
import { FormSpace } from "../types/formTypes";

type ArrayPath<T> = {
  [K in keyof T]: T[K] extends Array<any> ? K : never
}[keyof T];

export const getArrayFieldValue = <T extends any[]>(
  form: UseFormReturn<FormSpace>,
  field: ArrayPath<FormSpace>
): T => {
  const value = form.watch(field as Path<FormSpace>);
  return (Array.isArray(value) ? value : []) as T;
};

export const updateArrayField = <T extends any[]>(
  form: UseFormReturn<FormSpace>,
  field: ArrayPath<FormSpace>,
  newValue: T
) => {
  form.setValue(field as Path<FormSpace>, newValue as PathValue<FormSpace, Path<FormSpace>>);
};

export const addArrayItem = <T extends any[]>(
  form: UseFormReturn<FormSpace>,
  field: ArrayPath<FormSpace>,
  item: T[number]
) => {
  const currentValue = getArrayFieldValue<T>(form, field);
  updateArrayField(form, field, [...currentValue, item]);
};

export const removeArrayItem = <T extends any[]>(
  form: UseFormReturn<FormSpace>,
  field: ArrayPath<FormSpace>,
  index: number
) => {
  const currentValue = getArrayFieldValue<T>(form, field);
  updateArrayField(form, field, currentValue.filter((_, i) => i !== index));
};
