
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
  Lightbulb, Waves, PaintBucket, Wrench, Bug, Zap, HelpCircle, 
  Loader2
} from "lucide-react";
import { LocationFields } from "../form-sections/LocationFields";
import { ProblemTypeField } from "../form-sections/ProblemTypeField";
import { DescriptionField } from "../form-sections/DescriptionField";
import { SmartLocationStep } from "./components/SmartLocationStep";
import { useOccupantAssignments } from "@/hooks/occupants/useOccupantAssignments";
import { IssuePhotoForm } from "./IssuePhotoForm";
import { usePhotoUpload } from "../hooks/usePhotoUpload";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
  userId?: string;
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

export function IssueWizard({ onSuccess, onCancel, assignedRooms, userId }: IssueWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('type');
  const [isEmergency, setIsEmergency] = useState(false);
  const [useAssignedRoom, setUseAssignedRoom] = useState(true);
  const { uploading, selectedPhotos, handlePhotoUpload, setSelectedPhotos } = usePhotoUpload();
  const queryClient = useQueryClient();
  const [selectedIssueType, setSelectedIssueType] = useState<StandardizedIssueType | null>(null);
  
  // Get detailed room assignments for the user
  const { data: detailedAssignments } = useOccupantAssignments(userId);
  const primaryRoom = Array.isArray(detailedAssignments) ? detailedAssignments.find(room => room.is_primary) : undefined;
  const roomAssignments = Array.isArray(detailedAssignments) ? detailedAssignments : [];

  const form = useForm<FormData>({
    defaultValues: {
      priority: 'medium',
      description: '',
      due_date: undefined,
      date_info: '',
      ...(primaryRoom && {
        building_id: primaryRoom.building_id || '',
        floor_id: primaryRoom.floor_id || '',
        room_id: primaryRoom.room_id || ''
      })
    }
  });

  useEffect(() => {
    if (!useAssignedRoom) {
      form.setValue('building_id', '');
      form.setValue('floor_id', '');
      form.setValue('room_id', '');
    } else if (primaryRoom) {
      form.setValue('building_id', primaryRoom.building_id || '');
      form.setValue('floor_id', primaryRoom.floor_id || '');
      form.setValue('room_id', primaryRoom.room_id || '');
    }
  }, [useAssignedRoom, primaryRoom, form]);

  const watchIssueType = form.watch('issue_type');
  const watchBuildingId = form.watch('building_id');
  const watchFloorId = form.watch('floor_id');
  
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

  // Fetch buildings
  const { data: buildings = [], isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch floors based on selected building
  const { data: floors = [], isLoading: isLoadingFloors } = useQuery({
    queryKey: ['floors', watchBuildingId],
    queryFn: async () => {
      if (!watchBuildingId) return [];
      
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('building_id', watchBuildingId)
        .eq('status', 'active')
        .order('floor_number');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!watchBuildingId && !useAssignedRoom
  });

  // Fetch rooms based on selected floor
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['rooms', watchFloorId],
    queryFn: async () => {
      if (!watchFloorId) return [];
      
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('floor_id', watchFloorId)
        .eq('status', 'active')
        .order('room_number');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!watchFloorId && !useAssignedRoom
  });

  const handleBuildingSelect = (buildingId: string) => {
    form.setValue('building_id', buildingId);
    form.setValue('floor_id', '');
    form.setValue('room_id', '');
  };

  const handleFloorSelect = (floorId: string) => {
    form.setValue('floor_id', floorId);
    form.setValue('room_id', '');
  };

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
          issue_type: data.issue_type,
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

  const isNextButtonDisabled = () => {
    if (currentStep === 'type' && !useAssignedRoom) {
      return !form.getValues('room_id');
    }
    return false;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          {currentStep === 'type' && (
            <div className="space-y-6">
              {/* Location Selection - Use SmartLocationStep */}
              <SmartLocationStep 
                form={form as any}
                assignedRooms={roomAssignments}
                primaryRoom={primaryRoom}
              />
              
              {/* Issue Type Selection */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">What type of issue are you reporting?</h3>
                
                <RadioGroup
                  value={selectedIssueType || ''}
                  onValueChange={(value) => {
                    setSelectedIssueType(value as StandardizedIssueType);
                    form.setValue('issue_type', value as StandardizedIssueType);
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {ISSUE_TYPES.map((issueType) => (
                    <div key={issueType.id} className="relative">
                      <RadioGroupItem
                        value={issueType.id}
                        id={`issue-${issueType.id}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`issue-${issueType.id}`}
                        className={cn(
                          "flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer",
                          "transition-all duration-200",
                          "hover:border-primary/30 hover:bg-primary/5 hover:scale-[1.02]",
                          "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                          "peer-data-[state=checked]:shadow-md"
                        )}
                      >
                        <div className={cn("transition-colors", issueType.color)}>
                          {issueType.icon}
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{issueType.label}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {issueType.description}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </Card>
              
              {/* Problem Type Selection */}
              {selectedIssueType && (
                <Card className="p-6 animate-fade-in">
                  <ProblemTypeField form={form as any} />
                </Card>
              )}
            </div>
          )}

          {currentStep === 'details' && (
            <Card className="p-6 animate-fade-in">
              <h3 className="text-lg font-semibold mb-4">Describe the issue</h3>
              <div className="space-y-6">
                <DescriptionField form={form as any} />
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
                      ? `${primaryRoom.room_name || primaryRoom.room_id} - ${primaryRoom.building_name}, Floor ${primaryRoom.floor_name}`
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
              disabled={isNextButtonDisabled()}
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

export const getIssueTypeIcon = (type: string) => {
  switch (type) {
    case "Maintenance":
      return <Wrench className="h-4 w-4" />;
    case "Electrical":
      return <Zap className="h-4 w-4" />;
    case "Security":
      return <AlertTriangle className="h-4 w-4" />;
    case "Equipment":
      return <Wrench className="h-4 w-4" />;
    case "Bug":
      return <Bug className="h-4 w-4" />;
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
};
