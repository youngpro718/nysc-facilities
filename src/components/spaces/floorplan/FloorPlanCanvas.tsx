
import { useState } from "react";
import { FloorPlan3DView } from "./3d/FloorPlan3DView";
import { Button } from "@/components/ui/button";
import { Box, View } from "lucide-react";

interface FloorPlanCanvasProps {
  floorId: string | null;
  zoom?: number;
  onObjectSelect?: (obj: any) => void;
}

export function FloorPlanCanvas({ floorId, zoom = 1, onObjectSelect }: FloorPlanCanvasProps) {
  const [view, setView] = useState<"2d" | "3d">("2d");

  if (!floorId) {
    return (
      <div className="flex items-center justify-center h-[500px] border rounded-lg bg-muted">
        <p className="text-muted-foreground">Please select a floor to view the floor plan</p>
      </div>
    );
  }

  return (
    <div className="relative border rounded-lg bg-background">
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setView(view === "2d" ? "3d" : "2d")}
        >
          {view === "2d" ? (
            <Box className="h-4 w-4" />
          ) : (
            <View className="h-4 w-4" />
          )}
        </Button>
      </div>

      <FloorPlan3DView floorId={floorId} />
    </div>
  );
}
