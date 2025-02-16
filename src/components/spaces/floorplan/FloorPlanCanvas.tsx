
import { useState } from "react";
import { FloorPlanFlow } from "./components/FloorPlanFlow";
import { FloorPlan3DView } from "./3d/FloorPlan3DView";
import { Button } from "@/components/ui/button";
import { View3d, View } from "lucide-react";

interface FloorPlanCanvasProps {
  floorId: string | null;
}

export function FloorPlanCanvas({ floorId }: FloorPlanCanvasProps) {
  const [view, setView] = useState<"2d" | "3d">("2d");

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setView(view === "2d" ? "3d" : "2d")}
        >
          {view === "2d" ? (
            <View3d className="h-4 w-4" />
          ) : (
            <View className="h-4 w-4" />
          )}
        </Button>
      </div>

      {view === "2d" ? (
        <FloorPlanFlow floorId={floorId} />
      ) : (
        <FloorPlan3DView floorId={floorId} />
      )}
    </div>
  );
}
