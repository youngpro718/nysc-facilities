
import { AssignFixtureDialog } from "./AssignFixtureDialog";

interface RoomLightingSectionProps {
  roomId: string;
}

export function RoomLightingSection({ roomId }: RoomLightingSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Lighting</h3>
        <AssignFixtureDialog 
          roomId={roomId}
          onAssignmentComplete={() => {
            // Optionally refresh your room data
          }}
        />
      </div>
      {/* Add your other lighting related content here */}
    </div>
  );
}
