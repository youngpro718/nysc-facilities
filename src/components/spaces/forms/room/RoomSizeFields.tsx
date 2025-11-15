
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "./RoomFormSchema";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Maximize2 } from "lucide-react";
import { useState } from "react";

interface RoomSizeFieldsProps {
  form: UseFormReturn<RoomFormData>;
}

const ROOM_PRESETS = [
  { name: "Small Office", width: 120, height: 80 },
  { name: "Standard Office", width: 150, height: 100 },
  { name: "Large Office", width: 200, height: 120 },
  { name: "Conference Room", width: 300, height: 200 },
  { name: "Small Courtroom", width: 400, height: 300 },
  { name: "Large Courtroom", width: 600, height: 400 },
  { name: "Storage Room", width: 100, height: 60 },
];

export function RoomSizeFields({ form }: RoomSizeFieldsProps) {
  const [showPresets, setShowPresets] = useState(false);
  
  const currentSize = form.watch("size");
  const width = currentSize?.width || 150;
  const height = currentSize?.height || 100;
  
  // Calculate area in square feet (assuming dimensions are in pixels, convert to reasonable scale)
  const area = Math.round((width * height) / 100); // Scale factor for display
  
  const getSizeCategory = (area: number) => {
    if (area < 100) return { label: "Small", color: "bg-blue-100 text-blue-800" };
    if (area > 300) return { label: "Large", color: "bg-green-100 text-green-800" };
    return { label: "Medium", color: "bg-yellow-100 text-yellow-800" };
  };
  
  const sizeCategory = getSizeCategory(area);
  
  const applyPreset = (preset: typeof ROOM_PRESETS[0]) => {
    form.setValue("size", { width: preset.width, height: preset.height }, { shouldValidate: true });
    setShowPresets(false);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Room Dimensions</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPresets(!showPresets)}
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          Presets
        </Button>
      </div>
      
      {showPresets && (
        <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
          {ROOM_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              type="button"
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={() => applyPreset(preset)}
            >
              {preset.name}
              <span className="ml-auto text-xs text-muted-foreground">
                {preset.width}×{preset.height}
              </span>
            </Button>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="size.width"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Width</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={10}
                  max={1000}
                  {...field}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 150;
                    form.setValue("size", { ...currentSize, width: value }, { shouldValidate: true });
                  }}
                  value={width}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="size.height"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Height</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={10}
                  max={1000}
                  {...field}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 100;
                    form.setValue("size", { ...currentSize, height: value }, { shouldValidate: true });
                  }}
                  value={height}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            Area: <span className="font-medium">{area} sq ft</span>
          </span>
        </div>
        <Badge className={sizeCategory.color}>
          {sizeCategory.label} Room
        </Badge>
      </div>
    </div>
  );
}
