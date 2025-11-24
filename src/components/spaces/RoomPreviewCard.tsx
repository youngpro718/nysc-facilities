import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Layers, Hash, Edit2, Check, X } from 'lucide-react';
import { SmartDefaults } from '@/services/spaces/smartRoomDefaults';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { generateSmartRoomNumber } from '@/components/spaces/utils/roomNumberGenerator';

interface RoomPreviewCardProps {
  defaults: SmartDefaults;
  templateIcon: React.ComponentType<{ className?: string }>;
  templateName: string;
  templateColor: string;
  templateId: string;
  roomType: string;
  onConfirm: (name: string, roomNumber: string, buildingId: string, floorId: string) => void;
  onBack: () => void;
  isCreating?: boolean;
}

export function RoomPreviewCard({
  defaults,
  templateIcon: Icon,
  templateName,
  templateColor,
  templateId,
  roomType,
  onConfirm,
  onBack,
  isCreating = false
}: RoomPreviewCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingNumber, setIsEditingNumber] = useState(false);
  const [name, setName] = useState(defaults.name);
  const [roomNumber, setRoomNumber] = useState(defaults.roomNumber);
  const [buildingId, setBuildingId] = useState(defaults.buildingId);
  const [floorId, setFloorId] = useState(defaults.floorId);

  // Fetch buildings
  const { data: buildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch floors for selected building
  const { data: floors } = useQuery({
    queryKey: ['floors', buildingId],
    queryFn: async () => {
      if (!buildingId) return [];
      const { data, error } = await supabase
        .from('floors')
        .select('id, name, floor_number')
        .eq('building_id', buildingId)
        .order('floor_number');
      if (error) throw error;
      return data;
    },
    enabled: !!buildingId
  });

  // Regenerate room number when floor changes
  useEffect(() => {
    const regenerateRoomNumber = async () => {
      if (floorId && buildingId) {
        const floor = floors?.find(f => f.id === floorId);
        if (floor) {
          try {
            const newRoomNumber = await generateSmartRoomNumber({
              floorId,
              floorNumber: floor.floor_number,
              roomType,
              buildingId
            });
            setRoomNumber(newRoomNumber);
          } catch (error) {
            console.error('Error regenerating room number:', error);
          }
        }
      }
    };

    regenerateRoomNumber();
  }, [floorId, buildingId, floors, roomType]);

  const handleConfirm = () => {
    onConfirm(name, roomNumber, buildingId, floorId);
  };

  return (
    <Card className="border-2 border-primary/20 bg-accent/10">
      <CardContent className="p-6 space-y-6">
        {/* Template Header */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${templateColor} text-white`}>
            <Icon className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">{templateName}</h3>
            <p className="text-sm text-muted-foreground">Ready to create</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            Quick Create
          </Badge>
        </div>

        {/* Preview Details */}
        <div className="space-y-4 pt-4 border-t">
          {/* Room Name */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              <Edit2 className="h-3 w-3" />
              Room Name
            </Label>
            {isEditingName ? (
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 h-12 text-base touch-manipulation"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-12 w-12"
                  onClick={() => setIsEditingName(false)}
                >
                  <Check className="h-5 w-5 text-success" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-12 w-12"
                  onClick={() => {
                    setName(defaults.name);
                    setIsEditingName(false);
                  }}
                >
                  <X className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-accent/50 transition-colors text-left group"
              >
                <span className="font-medium text-base">{name}</span>
                <Edit2 className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </button>
            )}
          </div>

          {/* Room Number */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              <Hash className="h-3 w-3" />
              Room Number
            </Label>
            {isEditingNumber ? (
              <div className="flex gap-2">
                <Input
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="flex-1 h-12 text-base touch-manipulation"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-12 w-12"
                  onClick={() => setIsEditingNumber(false)}
                >
                  <Check className="h-5 w-5 text-success" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-12 w-12"
                  onClick={() => {
                    setRoomNumber(defaults.roomNumber);
                    setIsEditingNumber(false);
                  }}
                >
                  <X className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingNumber(true)}
                className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-accent/50 transition-colors text-left group"
              >
                <span className="font-medium text-base">{roomNumber}</span>
                <Edit2 className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </button>
            )}
          </div>

          {/* Location Selection */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-2">
                <Building2 className="h-3 w-3" />
                Building
              </Label>
              <Select value={buildingId} onValueChange={setBuildingId}>
                <SelectTrigger className="h-12 touch-manipulation">
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {buildings?.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-2">
                <Layers className="h-3 w-3" />
                Floor
              </Label>
              <Select 
                value={floorId} 
                onValueChange={setFloorId}
                disabled={!buildingId}
              >
                <SelectTrigger className="h-12 touch-manipulation">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {floors?.map((floor) => (
                    <SelectItem key={floor.id} value={floor.id}>
                      {floor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isCreating}
            className="flex-1 h-12 touch-manipulation"
          >
            Back
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isCreating || !name || !roomNumber || !buildingId || !floorId}
            className="flex-1 h-12 touch-manipulation"
          >
            {isCreating ? 'Creating...' : 'Create Space'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
