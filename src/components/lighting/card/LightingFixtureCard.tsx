
import { useState } from 'react';
import { LightingFixture } from "@/components/lighting/types";
import { CardFront } from "./CardFront";
import { CardBack } from "./CardBack";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

interface LightingFixtureCardProps {
  fixture: LightingFixture;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
  onFixtureUpdated: () => void;
}

export const LightingFixtureCard = ({ 
  fixture, 
  isSelected, 
  onSelect, 
  onDelete,
  onFixtureUpdated
}: LightingFixtureCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative w-full h-[300px] perspective-1000">
      <div className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${
        isFlipped ? 'rotate-y-180' : ''
      }`}>
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
        <CardFront
          fixture={fixture}
          isSelected={isSelected}
          onSelect={onSelect}
          onDelete={onDelete}
          onFixtureUpdated={onFixtureUpdated}
        />
        <CardBack
          fixture={fixture}
          onFlip={() => setIsFlipped(false)}
        />
      </div>
    </div>
  );
};
