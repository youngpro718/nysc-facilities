import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, MapPin, Mic, MicOff, Check, AlertCircle, Building2, Star, Settings, Camera, X, ImagePlus } from "lucide-react";
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SIMPLE_CATEGORIES, SimpleCategory, getBackendIssueType } from "./constants/simpleCategories";
import { usePhotoUpload } from "../hooks/usePhotoUpload";

// Flexible room assignment type that works with both UserAssignment and DetailedRoomAssignment
interface RoomAssignment {
  id?: string;
  room_id?: string;
  room_name?: string;
  room_number?: string;
  building_id?: string;
  building_name?: string;
  floor_id?: string;
  floor_name?: string;
  is_primary?: boolean;
  assignment_type?: string;
}

export interface SimpleReportWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  assignedRooms?: RoomAssignment[];
  isLoadingRooms?: boolean;
}

type Step = 'select' | 'describe';

export function SimpleReportWizard({ onSuccess, onCancel, assignedRooms, isLoadingRooms }: SimpleReportWizardProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [continueWithoutRoom, setContinueWithoutRoom] = useState(false);
  const [locationDescription, setLocationDescription] = useState('');
  const [description, setDescription] = useState('');
  
  // Voice dictation state
  const [isRecording, setIsRecording] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recognition, setRecognition] = useState<any>(null);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { uploading, selectedPhotos, setSelectedPhotos, handlePhotoUpload } = usePhotoUpload();

  const hasAssignedRooms = assignedRooms && assignedRooms.length > 0;

  // Normalize room ID getter (handles both room_id and id)
  const getRoomId = (room: RoomAssignment): string => room.room_id || room.id || '';
  const getRoomNumber = (room: RoomAssignment): string => room.room_number || room.room_name || 'Unknown';

  // Auto-select primary room on mount
  useEffect(() => {
    if (hasAssignedRooms) {
      // Priority: is_primary boolean → primary_office type → first room
      const primaryRoom = assignedRooms.find(r => r.is_primary) 
        || assignedRooms.find(r => r.assignment_type === 'primary_office')
        || assignedRooms[0];
      if (primaryRoom) {
        setSelectedRoomId(getRoomId(primaryRoom));
      }
    }
  }, [assignedRooms, hasAssignedRooms]);

  const selectedRoom = assignedRooms?.find(r => getRoomId(r) === selectedRoomId);
  const selectedCategoryData = SIMPLE_CATEGORIES.find(c => c.id === selectedCategory);

  const createIssueMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!selectedCategory) throw new Error('No category selected');
      if (!description.trim()) throw new Error('Description required');
      
      const issueType = getBackendIssueType(selectedCategory);
      
      const { error } = await supabase
        .from('issues')
        .insert({
          title: `${selectedCategoryData?.label || issueType} Issue`,
          description: description.trim(),
          issue_type: issueType,
          priority: 'medium',
          status: 'open',
          building_id: selectedRoom?.building_id || null,
          floor_id: selectedRoom?.floor_id || null,
          room_id: selectedRoomId || null,
          location_description: continueWithoutRoom ? locationDescription.trim() : null,
          photos: selectedPhotos,
          seen: false,
          created_by: user.id,
          reported_by: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Issue reported successfully");
      queryClient.invalidateQueries({ queryKey: ['userIssues'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      logger.error('Error creating issue:', error);
      toast.error((error as Error).message || "Failed to report issue");
    }
  });

  // Voice dictation handlers
  const startDictation = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Speech recognition not supported");
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const newRecognition = new SpeechRecognition();
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.lang = 'en-US';

      newRecognition.onstart = () => {
        setIsRecording(true);
        toast.success("Listening...");
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newRecognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setDescription(prev => (prev + ' ' + finalTranscript).trim());
        }
      };

      newRecognition.onerror = () => {
        setIsRecording(false);
        toast.error("Microphone error");
      };

      newRecognition.onend = () => setIsRecording(false);

      setRecognition(newRecognition);
      newRecognition.start();
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopDictation = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const handleNext = () => {
    if (!selectedCategory) {
      toast.error("Please select an issue type");
      return;
    }
    // Allow proceeding if room selected OR continuing without room (with location description)
    if (!selectedRoomId && !continueWithoutRoom) {
      toast.error("Please select a room or continue without one");
      return;
    }
    if (continueWithoutRoom && !locationDescription.trim()) {
      toast.error("Please describe where the issue is located");
      return;
    }
    setStep('describe');
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      toast.error("Please describe the issue");
      return;
    }
    createIssueMutation.mutate();
  };

  const handleContinueWithoutRoom = () => {
    setContinueWithoutRoom(true);
    setSelectedRoomId(null);
  };

  const canProceed = selectedCategory && (selectedRoomId || (continueWithoutRoom && locationDescription.trim()));

  return (
    <div className="w-full max-w-lg mx-auto">
      {step === 'select' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">Report an Issue</h2>
            <p className="text-sm text-muted-foreground">Quick and easy - just 2 steps</p>
          </div>

          {/* Room Selection - Show assigned rooms OR no-room handling */}
          {hasAssignedRooms && !continueWithoutRoom ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Your Room
              </Label>
              <RadioGroup
                value={selectedRoomId || ''}
                onValueChange={(value) => {
                  setSelectedRoomId(value);
                  setContinueWithoutRoom(false);
                }}
              >
              {assignedRooms.map((room) => {
                  const roomId = getRoomId(room);
                  const roomNumber = getRoomNumber(room);
                  const isPrimary = room.is_primary || room.assignment_type === 'primary_office';
                  return (
                    <div key={roomId} className="relative">
                      <RadioGroupItem
                        value={roomId}
                        id={`room-${roomId}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`room-${roomId}`}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                          "hover:border-primary/50 hover:bg-primary/5",
                          selectedRoomId === roomId
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isPrimary && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium">{roomNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {room.floor_name} • {room.building_name}
                            </p>
                          </div>
                        </div>
                        {selectedRoomId === roomId && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-muted-foreground"
                onClick={handleContinueWithoutRoom}
              >
                Report for a different location
              </Button>
            </div>
          ) : isLoadingRooms ? (
            /* Loading state */
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Your Room
              </Label>
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
          ) : !hasAssignedRooms && !continueWithoutRoom ? (
            /* No assigned rooms - show guidance to go to Settings */
            <Card className="p-4 border-dashed border-2 border-muted">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-full bg-muted">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">No assigned room yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Request a room from Settings, or describe the location manually.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <Button 
                    asChild
                    className="w-full"
                  >
                    <Link to="/profile?tab=settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Go to Settings
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleContinueWithoutRoom}
                    className="w-full"
                  >
                    Continue without a room
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            /* Continue without room - show location input */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Where is the issue?
                </Label>
                {hasAssignedRooms && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setContinueWithoutRoom(false);
                      // Re-select primary room
                      const primaryRoom = assignedRooms?.find(r => r.is_primary) 
                        || assignedRooms?.find(r => r.assignment_type === 'primary_office')
                        || assignedRooms?.[0];
                      if (primaryRoom) setSelectedRoomId(getRoomId(primaryRoom));
                    }}
                  >
                    Use my room
                  </Button>
                )}
              </div>
              <Input
                placeholder="e.g., 5th floor hallway near elevator"
                value={locationDescription}
                onChange={(e) => setLocationDescription(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Issue Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What's the issue?</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SIMPLE_CATEGORIES.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  selected={selectedCategory === category.id}
                  onSelect={() => setSelectedCategory(category.id)}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex-1"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 'describe' && (
        <div className="space-y-6">
          {/* Header with context */}
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('select')}
              className="gap-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <div className="flex items-center gap-2 flex-wrap">
              {selectedRoom && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedRoom.room_number}
                </Badge>
              )}
              {continueWithoutRoom && locationDescription && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {locationDescription.length > 20 ? locationDescription.slice(0, 20) + '...' : locationDescription}
                </Badge>
              )}
              {selectedCategoryData && (
                <Badge variant="outline" className={cn("gap-1", selectedCategoryData.color)}>
                  <selectedCategoryData.icon className="h-3 w-3" />
                  {selectedCategoryData.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Describe the issue</Label>
            <div className="relative">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's the problem? Tap the mic to dictate..."
                className="min-h-[120px] pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={isRecording ? stopDictation : startDictation}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5 text-destructive animate-pulse" />
                ) : (
                  <Mic className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Tap the microphone to dictate instead of typing
            </p>
          </div>

          {/* Photo Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Add Photos <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>

            {/* Photo previews */}
            {selectedPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {selectedPhotos.map((photo, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity touch-manipulation"
                      onClick={() => setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index))}
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <label className="cursor-pointer">
              <div className={cn(
                "flex items-center justify-center gap-2 w-full py-3 px-4",
                "border-2 border-dashed rounded-xl",
                "text-sm text-muted-foreground",
                "hover:border-primary/50 hover:bg-primary/5 transition-colors",
                "touch-manipulation active:scale-[0.98]",
                uploading && "opacity-50 pointer-events-none"
              )}>
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5" />
                    <span>{selectedPhotos.length > 0 ? 'Add more photos' : 'Take or choose a photo'}</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || createIssueMutation.isPending}
            className="w-full h-12 text-base"
          >
            {createIssueMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Category card component
interface CategoryCardProps {
  category: SimpleCategory;
  selected: boolean;
  onSelect: () => void;
}

function CategoryCard({ category, selected, onSelect }: CategoryCardProps) {
  const IconComponent = category.icon;
  
  return (
    <Card
      onClick={onSelect}
      className={cn(
        "p-4 cursor-pointer transition-all duration-200 relative",
        "flex flex-col items-center text-center gap-2",
        "hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02]",
        selected
          ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2"
          : "border-border"
      )}
    >
      <div className={cn(
        "p-3 rounded-full transition-all",
        selected ? "bg-primary/20 scale-110" : "bg-muted/50",
        category.color
      )}>
        <IconComponent className="h-6 w-6" />
      </div>
      <div>
        <p className={cn(
          "font-semibold text-sm",
          selected && "text-primary"
        )}>
          {category.label}
        </p>
        <p className="text-xs text-muted-foreground leading-tight">
          {category.description}
        </p>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </div>
      )}
    </Card>
  );
}
