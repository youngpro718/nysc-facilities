import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = [
  "📦", "📁", "🏷️", "📋", "📊", "🔧", "⚙️", "🔨", 
  "🔩", "🧰", "💊", "🩺", "📖", "✏️", "📎", "📌",
  "🏃", "👕", "👖", "👟", "🍕", "☕", "🖥️", "💾",
  "🔌", "💡", "🔋", "🔑", "🚪", "🪑", "🛏️", "🚗"
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
}

export const IconPicker = ({ value, onChange, disabled }: IconPickerProps) => {
  return (
    <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
      {icons.map((icon) => (
        <button
          key={icon}
          type="button"
          className={cn(
            "relative h-10 w-10 rounded-md border-2 transition-all flex items-center justify-center text-lg hover:bg-muted",
            value === icon
              ? "border-foreground ring-2 ring-ring ring-offset-1 bg-muted"
              : "border-transparent",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && onChange(icon)}
          disabled={disabled}
          title={`Select ${icon}`}
        >
          <span>{icon}</span>
          {value === icon && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
              <Check className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
};