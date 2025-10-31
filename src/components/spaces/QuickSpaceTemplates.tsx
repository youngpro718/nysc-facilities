import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Building2, 
  Scale, 
  Package, 
  Bath, 
  Coffee, 
  Users, 
  FileText, 
  Shield,
  Briefcase,
  Archive
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RoomTypeEnum } from './rooms/types/roomEnums';
import { createSpace } from './services/createSpace';
import { generateSmartRoomNumber, suggestRoomName } from './utils/roomNumberGenerator';

interface SpaceTemplate {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  roomType: RoomTypeEnum;
  defaultName: string;
  description: string;
  color: string;
}

const SPACE_TEMPLATES: SpaceTemplate[] = [
  {
    id: 'office',
    name: 'Office',
    icon: Briefcase,
    roomType: RoomTypeEnum.OFFICE,
    defaultName: 'Office',
    description: 'Standard office space',
    color: 'bg-blue-500'
  },
  {
    id: 'courtroom',
    name: 'Courtroom',
    icon: Scale,
    roomType: RoomTypeEnum.COURTROOM,
    defaultName: 'Courtroom',
    description: 'Court hearing room',
    color: 'bg-purple-500'
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: Package,
    roomType: RoomTypeEnum.UTILITY_ROOM,
    defaultName: 'Storage Room',
    description: 'Storage and supplies',
    color: 'bg-orange-500'
  },
  {
    id: 'filing',
    name: 'Filing Room',
    icon: Archive,
    roomType: RoomTypeEnum.FILING_ROOM,
    defaultName: 'Filing Room',
    description: 'Document filing',
    color: 'bg-teal-500'
  },
  {
    id: 'break_room',
    name: 'Break Room',
    icon: Coffee,
    roomType: RoomTypeEnum.BREAK_ROOM,
    defaultName: 'Break Room',
    description: 'Staff break area',
    color: 'bg-green-500'
  },
  {
    id: 'conference',
    name: 'Conference',
    icon: Users,
    roomType: RoomTypeEnum.CONFERENCE_ROOM,
    defaultName: 'Conference Room',
    description: 'Meeting room',
    color: 'bg-indigo-500'
  },
  {
    id: 'records',
    name: 'Records',
    icon: FileText,
    roomType: RoomTypeEnum.RECORDS_ROOM,
    defaultName: 'Records Room',
    description: 'Document storage',
    color: 'bg-gray-500'
  },
  {
    id: 'security',
    name: 'Security',
    icon: Shield,
    roomType: RoomTypeEnum.ADMINISTRATIVE_OFFICE,
    defaultName: 'Security Office',
    description: 'Security station',
    color: 'bg-red-500'
  }
];

interface QuickSpaceTemplatesProps {
  onClose: () => void;
  preselectedBuilding?: string;
  preselectedFloor?: string;
}

export function QuickSpaceTemplates({ 
  onClose, 
  preselectedBuilding, 
  preselectedFloor 
}: QuickSpaceTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<SpaceTemplate | null>(null);
  const [buildingId, setBuildingId] = useState(preselectedBuilding || '');
  const [floorId, setFloorId] = useState(preselectedFloor || '');
  const [roomNumber, setRoomNumber] = useState('');
  const [customName, setCustomName] = useState('');

  const queryClient = useQueryClient();

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

  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['floor-spaces'] });
      toast.success(`Successfully created ${selectedTemplate?.name.toLowerCase()}`);
      onClose();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create space';
      toast.error(errorMessage);
    }
  });

  const handleTemplateSelect = async (template: SpaceTemplate) => {
    setSelectedTemplate(template);
    
    // Generate smart defaults if building and floor are selected
    if (buildingId && floorId) {
      try {
        const suggestedName = await suggestRoomName(
          template.roomType, 
          floorId, 
          buildingId
        );
        setCustomName(suggestedName);

        const floor = floors?.find(f => f.id === floorId);
        if (floor) {
          const smartRoomNumber = await generateSmartRoomNumber({
            floorId,
            floorNumber: floor.floor_number,
            roomType: template.roomType,
            buildingId
          });
          setRoomNumber(smartRoomNumber);
        }
      } catch (error) {
        console.error('Error generating smart defaults:', error);
        setCustomName(template.defaultName);
      }
    } else {
      setCustomName(template.defaultName);
    }
  };

  const handleCreateSpace = () => {
    if (!selectedTemplate || !buildingId || !floorId) {
      toast.error('Please select a template, building, and floor');
      return;
    }

    const spaceName = customName || selectedTemplate.defaultName;
    const finalRoomNumber = roomNumber || generateRoomNumber();

    const spaceData = {
      type: 'room' as const,
      name: spaceName,
      buildingId,
      floorId,
      roomType: selectedTemplate.roomType,
      roomNumber: finalRoomNumber,
      currentFunction: selectedTemplate.name.toLowerCase(),
      description: selectedTemplate.description,
      isStorage: selectedTemplate.roomType === RoomTypeEnum.UTILITY_ROOM || selectedTemplate.roomType === RoomTypeEnum.FILING_ROOM,
      storageType: (selectedTemplate.roomType === RoomTypeEnum.UTILITY_ROOM || selectedTemplate.roomType === RoomTypeEnum.FILING_ROOM) ? 'general' as any : null,
      storageCapacity: (selectedTemplate.roomType === RoomTypeEnum.UTILITY_ROOM || selectedTemplate.roomType === RoomTypeEnum.FILING_ROOM) ? 100 : null,
      storageNotes: '',
      parentRoomId: null,
      connections: [],
      position: { x: 0, y: 0 },
      size: { width: 200, height: 150 },
      courtRoomPhotos: null
    };

    createSpaceMutation.mutate(spaceData);
  };

  const generateRoomNumber = () => {
    // Simple room number generation - could be made smarter
    const floorNumber = floors?.find(f => f.id === floorId)?.floor_number || 1;
    const randomNum = Math.floor(Math.random() * 99) + 1;
    return `${floorNumber}${randomNum.toString().padStart(2, '0')}`;
  };

  const handleBuildingChange = (newBuildingId: string) => {
    setBuildingId(newBuildingId);
    setFloorId(''); // Reset floor when building changes
  };

  if (selectedTemplate) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <selectedTemplate.icon className="h-5 w-5" />
            Create {selectedTemplate.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="building">Building</Label>
            <Select value={buildingId} onValueChange={handleBuildingChange}>
              <SelectTrigger className="touch-manipulation">
                <SelectValue placeholder="Select building" />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-background touch-manipulation">
                {buildings?.map((building) => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="floor">Floor</Label>
            <Select value={floorId} onValueChange={setFloorId}>
              <SelectTrigger className="touch-manipulation">
                <SelectValue placeholder="Select floor" />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-background touch-manipulation">
                {floors?.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={selectedTemplate.defaultName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room #</Label>
              <Input
                id="roomNumber"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Auto"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedTemplate(null)}
              className="flex-1"
            >
              Back
            </Button>
            <Button 
              onClick={handleCreateSpace}
              disabled={createSpaceMutation.isPending || !buildingId || !floorId}
              className="flex-1"
            >
              {createSpaceMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Quick Add Space</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {SPACE_TEMPLATES.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-muted"
              onClick={() => handleTemplateSelect(template)}
            >
              <div className={`p-2 rounded-full ${template.color} text-white`}>
                <template.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium">{template.name}</span>
            </Button>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
