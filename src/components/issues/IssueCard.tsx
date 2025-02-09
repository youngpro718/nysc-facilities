
import { type Issue } from "./types/IssueTypes";
import { CardFront } from "./card/CardFront";
import { CardBack } from "./card/CardBack";

interface IssueCardProps {
  issue: Issue;
  onDelete: (id: string) => Promise<void>;
  onUpdate: () => Promise<void>;
  onMarkAsSeen: (id: string) => Promise<void>;
  buildingName?: string;
  floorName?: string;
  roomName?: string;
  isFlipped?: boolean;
}

export const IssueCard = ({ 
  issue,
  onDelete,
  onUpdate,
  onMarkAsSeen,
  buildingName,
  floorName,
  roomName,
  isFlipped
}: IssueCardProps) => {
  return (
    <>
      <CardFront
        issue={issue}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onMarkAsSeen={onMarkAsSeen}
        buildingName={buildingName}
        floorName={floorName}
        roomName={roomName}
      />
      <CardBack issue={issue} />
    </>
  );
};
