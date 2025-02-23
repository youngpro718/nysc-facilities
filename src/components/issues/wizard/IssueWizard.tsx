import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { FormData } from "../types/formTypes";
import { StandardizedIssueType } from "../constants/issueTypes";
import { UserAssignment } from "@/types/dashboard";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  AlertTriangle, ChevronLeft, ChevronRight, Flag, 
  AlertOctagon, Bolt, Droplet, Building2, Key, 
  Thermometer, Trash2, DoorClosed, Construction,
  Lightbulb, Waves, PaintBucket
} from "lucide-react";
import { LocationFields } from "../form-sections/LocationFields";
import { ProblemTypeField } from "../form-sections/ProblemTypeField";
import { DescriptionField } from "../form-sections/DescriptionField";
import { IssuePhotoForm } from "./IssuePhotoForm";
import { usePhotoUpload } from "../hooks/usePhotoUpload";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface IssueWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  assignedRooms?: UserAssignment[];
}

type WizardStep = 'type' | 'details' | 'review';

interface IssueTypeOption {
  id: StandardizedIssueType;
  label: string;
  icon: JSX.Element;
  color: string;
  description: string;
}

const ISSUE_TYPES: IssueTypeOption[] = [
  {
    id: 'ELECTRICAL_NEEDS',
    label: 'Electrical',
    icon: <Bolt className="h-8 w-8" />,
    color: 'text-yellow-500',
    description: 'Power, lighting, or electrical issues'
  },
  {
    id: 'PLUMBING_NEEDS',
    label: 'Plumbing',
    icon: <Droplet className="h-8 w-8" />,
    color: 'text-blue-500',
    description: 'Water, leaks, or plumbing problems'
  },
  {
    id: 'CLIMATE_CONTROL',
    label: 'Climate',
    icon: <Thermometer className="h-8 w-8" />,
    color: 'text-orange-500',
    description: 'Heating, cooling, or ventilation'
  },
  {
    id: 'ACCESS_REQUEST',
    label: 'Access',
    icon: <Key className="h-8 w-8" />,
    color: 'text-purple-500',
    description: 'Door, lock, or access issues'
  },
  {
    id: 'BUILDING_SYSTEMS',
    label: 'Systems',
    icon: <Building2 className="h-8 w-8" />,
    color: 'text-green-500',
    description: 'Building infrastructure issues'
  },
  {
    id: 'CLEANING_REQUEST',
    label: 'Cleaning',
    icon: <Trash2 className="h-8 w-8" />,
    color: 'text-teal-500',
    description: 'Cleaning or maintenance needs'
  }
];

export function IssueWizard({ onSuccess, onCancel, assignedRooms }: IssueWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('type');
  const [isEmergency, setIsEmergency] = useState(false);
  const [useAssignedRoom, setUseAssignedRoom] = useState(true);
  const { uploading, selectedPhotos, handlePhotoUpload, setSelectedPhotos } = usePhotoUpload();
  const queryClient = useQueryClient();
  const [selectedIssueType, setSelectedIssueType] = useState<StandardizedIssueType | null>(null);
  
  // Find primary assigned room
  const primaryRoom = assignedRooms?.find(room => room.is_primary);

  const form = useForm<FormData>({
    defaultValues: {
      priority: 'medium',
      description: '',
      due_date: undefined,
      date_info: '',
      ...(primaryRoom && {
        building_id: primaryRoom.building_id,
        floor_id: primaryRoom.floor_id,
        room_id: primaryRoom.room_id
      })
    }
  });

  // Reset location fields when toggling assigned room
  useEffect(() => {
    if (!useAssignedRoom) {
      form.setValue('building_id', '');
      form.setValue('floor_id', '');
      form.setValue('room_id', '');
    } else if (primaryRoom) {
      form.setValue('building_id', primaryRoom.building_id);
      form.setValue('floor_id', primaryRoom.floor_id);
      form.setValue('room_id', primaryRoom.room_id);
    }
  }, [useAssignedRoom, primaryRoom, form]);

  // Watch for critical issue types
  const watchIssueType = form.watch('issue_type');
  useEffect(() => {
    if (watchIssueType && watchIssueType !== selectedIssueType) {
      setSelectedIssueType(watchIssueType);
      const isCritical = watchIssueType === 'BUILDING_SYSTEMS' || watchIssueType === 'ELECTRICAL_NEEDS';
      setIsEmergency(isCritical);
      if (isCritical) {
        form.setValue('priority', 'high');
      }
    }
  }, [watchIssueType, selectedIssueType, form]);

  // Add state for room selection
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // Fetch buildings when component mounts
  useEffect(() => {
    const fetchBuildings = async () => {
      const { data } = await supabase
        .from('buildings')
        .select('*')
        .eq('status', 'active');
      if (data) setBuildings(data);
    };
    fetchBuildings();
  }, []);

  // Fetch floors when building is selected
  useEffect(() => {
    const fetchFloors = async () => {
      if (!selectedBuilding) {
        setFloors([]);
        return;
      }
      const { data } = await supabase
        .from('floors')
        .select('*')
        .eq('building_id', selectedBuilding);
      if (data) setFloors(data);
    };
    fetchFloors();
  }, [selectedBuilding]);

  // Fetch rooms when floor is selected
  useEffect(() => {
    const fetchRooms = async () => {
      if (!selectedFloor) {
        setRooms([]);
        return;
      }
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('floor_id', selectedFloor);
      if (data) setRooms(data);
    };
    fetchRooms();
  }, [selectedFloor]);

  // Handle building selection
  const handleBuildingSelect = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    setSelectedFloor(null);
    form.setValue('building_id', buildingId);
    form.setValue('floor_id', '');
    form.setValue('room_id', '');
  };

  // Handle floor selection
  const handleFloorSelect = (floorId: string) => {
    setSelectedFloor(floorId);
    form.setValue('floor_id', floorId);
    form.setValue('room_id', '');
  };

  // Handle room selection
  const handleRoomSelect = (roomId: string) => {
    form.setValue('room_id', roomId);
  };

  const createIssueMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const formattedDueDate = data.due_date ? new Date(data.due_date).toISOString() : null;
      
      const { error } = await supabase
        .from('issues')
        .insert({
          title: data.title || `${data.issue_type} Issue ${data.problem_type ? `- ${data.problem_type}` : ''} - ${data.priority.toUpperCase()} Priority`,
          description: data.description,
          type: data.issue_type as StandardizedIssueType,
          priority: data.priority,
          status: 'open',
          building_id: data.building_id,
          floor_id: data.floor_id,
          room_id: data.room_id,
          photos: selectedPhotos,
          seen: false,
          due_date: formattedDueDate,
          date_info: data.date_info || null,
          created_by: user.id
        });
      
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['userIssues'] });
      await queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onSuccess: () => {
      toast.success("Issue reported successfully");
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error creating issue:', error);
      toast.error(error.message || "Failed to report issue");
    }
  });

  const onSubmit = (data: FormData) => {
    createIssueMutation.mutate(data);
  };

  const handleNext = async () => {
    const steps: WizardStep[] = ['type', 'details', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      const isValid = await form.trigger(getFieldsForStep(currentStep));
      if (isValid) {
        setCurrentStep(steps[currentIndex + 1]);
      }
    }
  };

  const handleBack = () => {
    const steps: WizardStep[] = ['type', 'details', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const getFieldsForStep = (step: WizardStep): (keyof FormData)[] => {
    switch (step) {
      case 'type':
        return ['issue_type', 'problem_type'];
      case 'details':
        return ['description'];
      case 'review':
        return [];
      default:
        return [];
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Room Selection Header */}
        {assignedRooms && assignedRooms.length > 0 ? (
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DoorClosed className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Room Selection</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Use assigned room</span>
                  <Switch
                    checked={useAssignedRoom}
                    onCheckedChange={setUseAssignedRoom}
                  />
                </div>
              </div>

              {useAssignedRoom && (
                <RadioGroup
                  value={form.watch('room_id') || ''}
                  onValueChange={(roomId) => {
                    const selectedRoom = assignedRooms.find(room => room.id === roomId);
                    if (selectedRoom) {
                      form.setValue('building_id', selectedRoom.building_id || '');
                      form.setValue('floor_id', selectedRoom.floor_id || '');
                      form.setValue('room_id', roomId);
                    }
                  }}
                  className="grid grid-cols-1 gap-2"
                >
                  {assignedRooms.map((room) => (
                    <div key={room.id}>
                      <RadioGroupItem
                        value={room.id}
                        id={`assigned-room-${room.id}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`assigned-room-${room.id}`}
                        className={cn(
                          "flex items-center gap-2 p-4 rounded-lg border cursor-pointer",
                          "hover:bg-accent hover:text-accent-foreground",
                          "peer-data-[state=checked]:border-primary",
                          "peer-data-[state=checked]:bg-primary/5"
                        )}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{room.room_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {room.building_name} - Floor {room.floor_name}
                          </div>
                        </div>
                        {room.is_primary && (
                          <Badge variant="secondary" className="ml-auto">Primary</Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          </Card>
        ) : (
          <Alert>
            <AlertDescription>
              You don't have any assigned rooms. Please select a room manually.
            </AlertDescription>
          </Alert>
        )}

        {isEmergency && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertOctagon className="h-4 w-4" />
            <AlertDescription>
              This appears to be a critical issue. It will be marked as high priority.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            {['type', 'details', 'review'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    currentStep === step
                      ? "bg-primary text-primary-foreground"
                      : index < ['type', 'details', 'review'].indexOf(currentStep)
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {index + 1}
                </div>
                {index < 2 && (
                  <div
                    className={cn(
                      "h-0.5 w-12",
                      index < ['type', 'details', 'review'].indexOf(currentStep)
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {currentStep === 'type' && (
            <Card className="p-6 animate-fade-in">
              <h3 className="text-lg font-semibold mb-4">What type of issue are you reporting?</h3>
              
              {/* Location Selection when not using assigned room */}
              {!useAssignedRoom && (
                <div className="mb-6 space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Select Building</h4>
                    <RadioGroup
                      value={selectedBuilding || ''}
                      onValueChange={handleBuildingSelect}
                      className="grid grid-cols-1 md:grid-cols-2 gap-2"
                    >
                      {buildings.map((building) => (
                        <div key={building.id}>
                          <RadioGroupItem
                            value={building.id}
                            id={`building-${building.id}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`building-${building.id}`}
                            className={cn(
                              "flex items-center gap-2 p-4 rounded-lg border cursor-pointer",
                              "hover:bg-accent hover:text-accent-foreground",
                              "peer-data-[state=checked]:border-primary",
                              "peer-data-[state=checked]:bg-primary/5"
                            )}
                          >
                            <Building2 className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{building.name}</div>
                              <div className="text-xs text-muted-foreground">{building.address}</div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {selectedBuilding && (
                    <div className="space-y-4 animate-fade-in">
                      <h4 className="font-medium">Select Floor</h4>
                      <RadioGroup
                        value={selectedFloor || ''}
                        onValueChange={handleFloorSelect}
                        className="grid grid-cols-2 md:grid-cols-4 gap-2"
                      >
                        {floors.map((floor) => (
                          <div key={floor.id}>
                            <RadioGroupItem
                              value={floor.id}
                              id={`floor-${floor.id}`}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={`floor-${floor.id}`}
                              className={cn(
                                "flex items-center justify-center p-4 rounded-lg border cursor-pointer",
                                "hover:bg-accent hover:text-accent-foreground",
                                "peer-data-[state=checked]:border-primary",
                                "peer-data-[state=checked]:bg-primary/5"
                              )}
                            >
                              {floor.name}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {selectedFloor && (
                    <div className="space-y-4 animate-fade-in">
                      <h4 className="font-medium">Select Room</h4>
                      <ScrollArea className="h-[200px]">
                        <RadioGroup
                          value={form.watch('room_id') || ''}
                          onValueChange={handleRoomSelect}
                          className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-4"
                        >
                          {rooms.map((room) => (
                            <div key={room.id}>
                              <RadioGroupItem
                                value={room.id}
                                id={`room-${room.id}`}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={`room-${room.id}`}
                                className={cn(
                                  "flex items-center gap-2 p-4 rounded-lg border cursor-pointer",
                                  "hover:bg-accent hover:text-accent-foreground",
                                  "peer-data-[state=checked]:border-primary",
                                  "peer-data-[state=checked]:bg-primary/5"
                                )}
                              >
                                <DoorClosed className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{room.name}</div>
                                  <div className="text-xs text-muted-foreground">Room {room.room_number}</div>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}

              {/* Large Issue Type Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ISSUE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className={cn(
                      "relative p-6 rounded-lg border-2 transition-all duration-200",
                      "hover:scale-105 hover:shadow-lg",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      form.watch('issue_type') === type.id
                        ? "border-primary bg-primary/5"
                        : "border-muted bg-card hover:border-primary/50"
                    )}
                    onClick={() => form.setValue('issue_type', type.id)}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className={cn("transition-colors", type.color)}>
                        {type.icon}
                      </div>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <p className="text-xs text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Problem Type Selection */}
              {form.watch('issue_type') && (
                <div className="mt-6 animate-fade-in">
                  <ProblemTypeField form={form} />
                </div>
              )}
            </Card>
          )}

          {currentStep === 'details' && (
            <Card className="p-6 animate-fade-in">
              <h3 className="text-lg font-semibold mb-4">Describe the issue</h3>
              <div className="space-y-6">
                <DescriptionField form={form} />
                <IssuePhotoForm
                  selectedPhotos={selectedPhotos}
                  uploading={uploading}
                  onPhotoUpload={handlePhotoUpload}
                  onPhotoRemove={(index) => {
                    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
                  }}
                />
              </div>
            </Card>
          )}

          {currentStep === 'review' && (
            <Card className="p-6 animate-fade-in">
              <h3 className="text-lg font-semibold mb-4">Review and Submit</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Location</h4>
                  <p className="text-muted-foreground">
                    {primaryRoom && useAssignedRoom
                      ? `${primaryRoom.room_name} - ${primaryRoom.building_name}, Floor ${primaryRoom.floor_name}`
                      : 'Custom location selected'}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Issue Type</h4>
                  <div className="flex items-center gap-2">
                    {ISSUE_TYPES.find(t => t.id === form.watch('issue_type'))?.icon}
                    <span>{form.watch('issue_type')}</span>
                    {form.watch('problem_type') && (
                      <Badge variant="secondary">
                        {form.watch('problem_type')}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Description</h4>
                  <p className="text-muted-foreground">{form.watch('description')}</p>
                </div>

                {selectedPhotos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Photos</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedPhotos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Issue photo ${index + 1}`}
                          className="rounded-lg aspect-square object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 'type' ? onCancel : handleBack}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {currentStep === 'type' ? 'Cancel' : 'Back'}
          </Button>

          {currentStep === 'review' ? (
            <Button 
              type="submit"
              disabled={createIssueMutation.isPending}
            >
              {createIssueMutation.isPending ? (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Submitting...
                </>
              ) : (
                'Submit Issue'
              )}
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleNext}
              disabled={!useAssignedRoom && !form.watch('room_id')}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

