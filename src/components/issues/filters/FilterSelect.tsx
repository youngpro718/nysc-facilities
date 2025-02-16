
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterSelectProps {
  icon?: LucideIcon;
  placeholder: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
  fullWidth?: boolean;
}

export const FilterSelect = ({
  icon: Icon,
  placeholder,
  value,
  onValueChange,
  options,
  className = "",
  fullWidth = false
}: FilterSelectProps) => {
  return (
    <div className={cn("flex items-center gap-2", fullWidth && "w-full", className)}>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger className={cn("h-9", fullWidth ? "w-full" : "w-[180px]")}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
