import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Scale, 
  Package, 
  Coffee, 
  Users, 
  FileText, 
  Shield,
  Briefcase,
  Archive,
  Loader2
} from 'lucide-react';
import { RoomTypeEnum } from './rooms/types/roomEnums';
import { createSpace } from './services/createSpace';
import { generateSmartDefaults } from '@/services/spaces/smartRoomDefaults';
import { RoomPreviewCard } from './RoomPreviewCard';
import { RoomQuickEditSheet } from './RoomQuickEditSheet';

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
  const [smartDefaults, setSmartDefaults] = useState<any | null>(null);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [showQuickEdit, setShowQuickEdit] = useState(false);

  const queryClient = useQueryClient();

  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['floor-spaces'] });
      
      setCreatedRoomId(data.id);
      
      toast.success(`Successfully created ${selectedTemplate?.name.toLowerCase()}`, {
        action: {
          label: 'Edit Details',
          onClick: () => setShowQuickEdit(true)
        }
      });
      
      // Close after a short delay
      setTimeout(onClose, 2000);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create space';
      toast.error(errorMessage);
    }
  });

  const handleTemplateSelect = async (template: SpaceTemplate) => {
    setSelectedTemplate(template);
    setIsLoadingDefaults(true);
    
    try {
      const defaults = await generateSmartDefaults({
        templateId: template.id,
        roomType: template.roomType,
        defaultName: template.defaultName,
        buildingId: preselectedBuilding,
        floorId: preselectedFloor
      });
      
      setSmartDefaults(defaults);
    } catch (error) {
      logger.error('Error generating smart defaults:', error);
      toast.error('Failed to generate defaults');
      setSelectedTemplate(null);
    } finally {
      setIsLoadingDefaults(false);
    }
  };

  const handleCreateSpace = (name: string, roomNumber: string, buildingId: string, floorId: string) => {
    if (!selectedTemplate) {
      toast.error('Missing required information');
      return;
    }

    const spaceData = {
      type: 'room' as const,
      name,
      buildingId,
      floorId,
      roomType: selectedTemplate.roomType,
      roomNumber,
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

  // Loading state
  if (isLoadingDefaults && selectedTemplate) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating smart defaults...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview state
  if (selectedTemplate && smartDefaults) {
    return (
      <>
        <RoomPreviewCard
          defaults={smartDefaults}
          templateIcon={selectedTemplate.icon}
          templateName={selectedTemplate.name}
          templateColor={selectedTemplate.color}
          templateId={selectedTemplate.id}
          roomType={selectedTemplate.roomType}
          onConfirm={handleCreateSpace}
          onBack={() => {
            setSelectedTemplate(null);
            setSmartDefaults(null);
          }}
          isCreating={createSpaceMutation.isPending}
        />
        
        {createdRoomId && (
          <RoomQuickEditSheet
            open={showQuickEdit}
            onClose={() => setShowQuickEdit(false)}
            roomId={createdRoomId}
            roomType={selectedTemplate.roomType}
          />
        )}
      </>
    );
  }

  // Template selection
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Choose Space Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {SPACE_TEMPLATES.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-accent touch-manipulation"
              onClick={() => handleTemplateSelect(template)}
            >
              <div className={`p-2.5 rounded-full ${template.color} text-white`}>
                <template.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{template.name}</span>
            </Button>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full touch-manipulation"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
