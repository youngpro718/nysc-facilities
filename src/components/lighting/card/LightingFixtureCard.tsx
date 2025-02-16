
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
    <div className="relative w-full h-[300px] [perspective:1000px]">
      <div 
        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
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
        />
      </div>
    </div>
  );
};
