import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoomAccessSummary } from "@features/occupants/components/access/RoomAccessSummary";
import { OccupantDepartureView } from "@features/occupants/components/access/OccupantDepartureView";
import { OccupantPicker } from "@features/occupants/components/access/OccupantPicker";
import { DeliveryRoomPicker } from "@features/supply/components/supply/DeliveryRoomPicker";

export default function AccessManagement() {
  // Deep-linkable from the room wizard ("Assign New Occupant" / "View Full History"):
  // /occupants?room=<id>&tab=history
  const [searchParams] = useSearchParams();
  const initialRoom = searchParams.get('room') ?? '';
  const initialTab = searchParams.get('tab') === 'departure' ? 'departure' : 'room';
  const [activeTab, setActiveTab] = useState<'room' | 'departure'>(initialTab);
  const [roomId, setRoomId] = useState(initialRoom);
  const [roomLabel, setRoomLabel] = useState('');
  const [occupantId, setOccupantId] = useState('');

  return (
    <PageContainer>
      <PageHeader
        title="Personnel"
        description="Look up room access and process occupant departures"
      />

      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'room' ? 'default' : 'outline'}
            onClick={() => setActiveTab('room')}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Room Access
          </Button>
          <Button
            variant={activeTab === 'departure' ? 'default' : 'outline'}
            onClick={() => setActiveTab('departure')}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Occupant Departure
          </Button>
        </div>

        {/* Room Access Tab */}
        {activeTab === 'room' && (
          <div className="space-y-4">
            <DeliveryRoomPicker
              value={roomLabel}
              onChange={(label, id) => {
                setRoomLabel(label);
                if (id) setRoomId(id);
              }}
              placeholder="Search rooms by number, name, or building…"
              ariaLabel="Room"
            />

            {roomId && <RoomAccessSummary roomId={roomId} />}
          </div>
        )}

        {/* Occupant Departure Tab */}
        {activeTab === 'departure' && (
          <div className="space-y-4">
            <OccupantPicker
              value={occupantId}
              onChange={(id) => setOccupantId(id)}
              placeholder="Search occupants by name or department…"
            />

            {occupantId && (
              <OccupantDepartureView
                occupantId={occupantId}
                onComplete={() => {
                  setOccupantId('');
                }}
              />
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}