// @ts-nocheck
import { useState } from 'react';
import { LightingFixture } from "@/types/lighting";
import { CardFront } from "./CardFront";
import { CardBack } from "./CardBack";
import { cn } from "@/lib/utils";

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
    <div 
      id={`fixture-card-${fixture.id}`}
      data-fixture-id={fixture.id}
      className="relative w-full h-[320px]"
      style={{ perspective: '1000px', WebkitPerspective: '1000px' as unknown }}
    >
      <div 
        className={cn(
          "relative w-full h-full duration-500",
          "preserve-3d transition-transform",
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        )}
        style={{ 
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d' as unknown,
          willChange: 'transform'
        }}
      >
        {/* Front of card */}
        <div 
          className="absolute w-full h-full backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardFront
            fixture={fixture}
            isSelected={isSelected}
            onSelect={onSelect}
            onDelete={onDelete}
            onFixtureUpdated={onFixtureUpdated}
            onFlip={() => setIsFlipped(true)}
          />
        </div>

        {/* Back of card */}
        <div 
          className="absolute w-full h-full [transform:rotateY(180deg)] backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardBack
            fixture={fixture}
            onFlip={() => setIsFlipped(false)}
          />
        </div>
      </div>
    </div>
  );
};
