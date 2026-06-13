import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Building2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoomAccessSummary } from "@features/occupants/components/access/RoomAccessSummary";
import { OccupantDepartureView } from "@features/occupants/components/access/OccupantDepartureView";

export default function AccessManagement() {
  // Deep-linkable from the room wizard ("Assign New Occupant" / "View Full History"):
  // /occupants?room=<id>&tab=history
  const [searchParams] = useSearchParams();
  const initialRoom = searchParams.get('room') ?? '';
  const initialTab = searchParams.get('tab') === 'departure' ? 'departure' : 'room';
  const [activeTab, setActiveTab] = useState<'room' | 'departure'>(initialTab);
  const [roomId, setRoomId] = useState(initialRoom);
  const [occupantId, setOccupantId] = useState('');

  return (
    <PageContainer>
      <PageHeader 
        title="Access Management" 
        description="Manage room access and occupant departures"
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
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter Room ID to view access summary..."
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
              </div>
              <Button onClick={() => setRoomId(roomId.trim())}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            
            {roomId && <RoomAccessSummary roomId={roomId} />}
          </div>
        )}

        {/* Occupant Departure Tab */}
        {activeTab === 'departure' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter Occupant ID for departure process..."
                  value={occupantId}
                  onChange={(e) => setOccupantId(e.target.value)}
                />
              </div>
              <Button onClick={() => setOccupantId(occupantId.trim())}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            
            {occupantId && (
              <OccupantDepartureView 
                occupantId={occupantId}
                onComplete={() => {
                  // Optionally clear the occupant ID or show success message
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