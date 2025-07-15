import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const colors = [
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "gray", label: "Gray", class: "bg-gray-500" },
] as const;

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export const ColorPicker = ({ value, onChange, disabled }: ColorPickerProps) => {
  return (
    <div className="grid grid-cols-4 gap-3">
      {colors.map((color) => (
        <button
          key={color.value}
          type="button"
          className={cn(
            "relative h-12 w-full rounded-lg border-2 transition-all",
            color.class,
            value === color.value
              ? "border-foreground ring-2 ring-ring ring-offset-2"
              : "border-transparent hover:border-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && onChange(color.value)}
          disabled={disabled}
          title={color.label}
        >
          {value === color.value && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Check className="h-5 w-5 text-white drop-shadow-sm" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
};