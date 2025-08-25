import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLightingFixtures } from "@/hooks/useLightingFixtures";
import { LightingPosition, LightingType, LightStatus, LightingTechnology } from "@/types/lighting";

type DatabaseLightType = "standard" | "emergency" | "motion_sensor";
type DatabaseLightStatus = "functional" | "maintenance_needed" | "non_functional" | "pending_maintenance" | "scheduled_replacement";
type DatabaseLightPosition = "ceiling" | "wall" | "floor" | "desk" | "recessed";
type DatabaseLightTechnology = "LED" | "Fluorescent" | "Bulb";

interface Room {
  id: string;
  room_number: string;
  name: string;
  floor_name: string;
  building_name: string;
}

interface EnhancedLightingCreationProps {
  onFixtureCreated?: () => void;
}

export function EnhancedLightingCreation({ onFixtureCreated }: EnhancedLightingCreationProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [fixtures, setFixtures] = useState([{
    id: Math.random().toString(),
    type: 'standard' as DatabaseLightType,
    technology: 'LED' as DatabaseLightTechnology,
    position: 'ceiling' as DatabaseLightPosition,
    status: 'functional' as DatabaseLightStatus,
    bulb_count: 1,
    ballast_issue: false,
    maintenance_notes: ''
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const { refetch } = useLightingFixtures();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          name,
          floors!inner(
            name,
            buildings!inner(name)
          )
        `)
        .order('room_number');

      if (error) throw error;

      const formattedRooms = data.map((room: any) => ({
        id: room.id,
        room_number: room.room_number,
        name: room.name,
        floor_name: room.floors.name,
        building_name: room.floors.buildings.name
      }));

      setRooms(formattedRooms);
    } catch (error: any) {
      toast.error("Failed to load rooms");
    }
  };

  const generateFixtureName = (fixture: any, index: number) => {
    if (!selectedRoom) return '';
    
    const typeMap = {
      'standard': 'LED Panel',
      'emergency': 'Emergency Light',
      'motion_sensor': 'Motion Sensor Light'
    };

    const positionMap = {
      'ceiling': 'Ceiling',
      'wall': 'Wall',
      'floor': 'Floor',
      'desk': 'Desk',
      'recessed': 'Recessed'
    };

    return `${selectedRoom.building_name} - ${selectedRoom.floor_name} - ${selectedRoom.room_number} - ${typeMap[fixture.type]} - ${positionMap[fixture.position]} ${index + 1}`;
  };

  const addFixture = () => {
    setFixtures([...fixtures, {
      id: Math.random().toString(),
      type: 'standard' as DatabaseLightType,
      technology: 'LED' as DatabaseLightTechnology,
      position: 'ceiling' as DatabaseLightPosition,
      status: 'functional' as DatabaseLightStatus,
      bulb_count: 1,
      ballast_issue: false,
      maintenance_notes: ''
    }]);
  };

  const removeFixture = (id: string) => {
    setFixtures(fixtures.filter(f => f.id !== id));
  };

  const updateFixture = (id: string, field: string, value: any) => {
    setFixtures(fixtures.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const handleSubmit = async () => {
    if (!selectedRoom) {
      toast.error("Please select a room");
      return;
    }

    setIsLoading(true);
    try {
      const fixtureData = fixtures.map((fixture, index) => ({
        name: generateFixtureName(fixture, index),
        type: fixture.type,
        technology: fixture.technology,
        position: fixture.position,
        status: fixture.status,
        bulb_count: fixture.bulb_count,
        ballast_issue: fixture.ballast_issue,
        maintenance_notes: fixture.maintenance_notes,
        space_type: 'room',
        space_id: selectedRoom.id,
        electrical_issues: {
          short_circuit: false,
          wiring_issues: false,
          voltage_problems: false
        }
      }));

      const { error } = await supabase
        .from('lighting_fixtures')
        .insert(fixtureData);

      if (error) throw error;

      toast.success(`Successfully created ${fixtures.length} lighting fixtures`);
      
      // Reset form
      setSelectedRoom(null);
      setFixtures([{
        id: Math.random().toString(),
        type: 'standard' as DatabaseLightType,
        technology: 'LED' as DatabaseLightTechnology,
        position: 'ceiling' as DatabaseLightPosition,
        status: 'functional' as DatabaseLightStatus,
        bulb_count: 1,
        ballast_issue: false,
        maintenance_notes: ''
      }]);
      
      refetch();
      onFixtureCreated?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create fixtures");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enhanced Lighting Creation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Room Selection */}
        <div>
          <Label>Select Room</Label>
          <Select 
            value={selectedRoom?.id || ""} 
            onValueChange={(value) => {
              const room = rooms.find(r => r.id === value);
              setSelectedRoom(room || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.building_name} - {room.floor_name} - {room.room_number}
                  {room.name && ` (${room.name})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fixtures */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Lighting Fixtures</Label>
            <Button variant="outline" size="sm" onClick={addFixture}>
              Add Another Fixture
            </Button>
          </div>

          {fixtures.map((fixture, index) => (
            <Card key={fixture.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">Fixture {index + 1}</Badge>
                {fixtures.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFixture(fixture.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              {selectedRoom && (
                <div className="mb-4 p-3 bg-muted rounded text-sm">
                  <strong>Generated Name:</strong> {generateFixtureName(fixture, index)}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select 
                    value={fixture.type} 
                    onValueChange={(value) => updateFixture(fixture.id, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="motion_sensor">Motion Sensor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Technology</Label>
                  <Select 
                    value={fixture.technology} 
                    onValueChange={(value) => updateFixture(fixture.id, 'technology', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LED">LED</SelectItem>
                      <SelectItem value="Fluorescent">Fluorescent</SelectItem>
                      <SelectItem value="Bulb">Incandescent Bulb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Position</Label>
                  <Select 
                    value={fixture.position} 
                    onValueChange={(value) => updateFixture(fixture.id, 'position', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ceiling">Ceiling</SelectItem>
                      <SelectItem value="wall">Wall</SelectItem>
                      <SelectItem value="floor">Floor</SelectItem>
                      <SelectItem value="desk">Desk</SelectItem>
                      <SelectItem value="recessed">Recessed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select 
                    value={fixture.status} 
                    onValueChange={(value) => updateFixture(fixture.id, 'status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="functional">Functional</SelectItem>
                      <SelectItem value="maintenance_needed">Maintenance Needed</SelectItem>
                      <SelectItem value="non_functional">Non-Functional</SelectItem>
                      <SelectItem value="pending_maintenance">Pending Maintenance</SelectItem>
                      <SelectItem value="scheduled_replacement">Scheduled Replacement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Bulb Count</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={fixture.bulb_count}
                    onChange={(e) => updateFixture(fixture.id, 'bulb_count', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              {fixture.maintenance_notes && (
                <div className="mt-4">
                  <Label>Maintenance Notes</Label>
                  <Textarea 
                    value={fixture.maintenance_notes}
                    onChange={(e) => updateFixture(fixture.id, 'maintenance_notes', e.target.value)}
                    placeholder="Optional maintenance notes"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || !selectedRoom}
          className="w-full"
        >
          {isLoading ? "Creating..." : `Create ${fixtures.length} Fixture${fixtures.length > 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
}