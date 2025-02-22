
import { useState } from "react";
import { Issue } from "../types/IssueTypes";
import { CardFront } from "./CardFront";
import { CardBack } from "./CardBack";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

interface IssueCardProps {
  issue: Issue;
  onMarkAsSeen?: (id: string) => void;
}

export function IssueCard({ issue, onMarkAsSeen }: IssueCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative w-full h-[320px] perspective-1000">
      <div 
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            variant="outline"
            size="icon"
            className="transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
        <CardFront 
          issue={issue} 
          onMarkAsSeen={onMarkAsSeen}
        />
        <CardBack issue={issue} />
      </div>
    </div>
  );
}
