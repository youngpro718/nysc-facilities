
import { useState } from "react";
import { IssueCard } from "../IssueCard";
import { type Issue } from "../types/IssueTypes";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

interface IssueGridProps {
  issues: Issue[];
  onDelete: (id: string) => Promise<void>;
  onUpdate: () => Promise<void>;
  onMarkAsSeen: (id: string) => Promise<void>;
}

export const IssueGrid = ({ 
  issues,
  onDelete,
  onUpdate,
  onMarkAsSeen
}: IssueGridProps) => {
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 px-2">
      {issues.map((issue) => (
        <div 
          key={issue.id} 
          className="relative w-full h-[400px] perspective-1000"
        >
          <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flippedCardId === issue.id ? 'rotate-y-180' : ''}`}>
            <div className="absolute bottom-4 right-4 z-10">
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setFlippedCardId(flippedCardId === issue.id ? null : issue.id);
                }}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
            <IssueCard
              issue={issue}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onMarkAsSeen={onMarkAsSeen}
              buildingName={issue.buildingName}
              floorName={issue.floorName}
              roomName={issue.roomName}
              isFlipped={flippedCardId === issue.id}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
