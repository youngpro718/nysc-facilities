import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, MapPin, Mic, MicOff, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { UserAssignment } from "@/types/dashboard";
import { SIMPLE_CATEGORIES, SimpleCategory, getBackendIssueType } from "./constants/simpleCategories";

export interface SimpleReportWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  assignedRooms?: UserAssignment[];
}

type Step = 'select' | 'describe';

export function SimpleReportWizard({ onSuccess, onCancel, assignedRooms }: SimpleReportWizardProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [useDifferentRoom, setUseDifferentRoom] = useState(false);
  const [description, setDescription] = useState('');
  
  // Voice dictation state
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Auto-select primary room on mount
  useEffect(() => {
    if (assignedRooms && assignedRooms.length > 0) {
      const primaryRoom = assignedRooms.find(r => r.assignment_type === 'primary') || assignedRooms[0];
      if (primaryRoom) {
        setSelectedRoomId(primaryRoom.room_id);
      }
    }
  }, [assignedRooms]);

  const selectedRoom = assignedRooms?.find(r => r.room_id === selectedRoomId);
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
          photos: [],
          seen: false,
          created_by: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Issue reported successfully");
      queryClient.invalidateQueries({ queryKey: ['userIssues'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error creating issue:', error);
      toast.error(error.message || "Failed to report issue");
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
      
      const newRecognition = new (window as any).webkitSpeechRecognition();
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.lang = 'en-US';

      newRecognition.onstart = () => {
        setIsRecording(true);
        toast.success("Listening...");
      };

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
    if (!selectedRoomId && !useDifferentRoom) {
      toast.error("Please select a room");
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

  const canProceed = selectedCategory && (selectedRoomId || useDifferentRoom);

  return (
    <div className="w-full max-w-lg mx-auto">
      {step === 'select' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">Report an Issue</h2>
            <p className="text-sm text-muted-foreground">Quick and easy - just 2 steps</p>
          </div>

          {/* Room Selection */}
          {assignedRooms && assignedRooms.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Your Room
              </Label>
              <RadioGroup
                value={selectedRoomId || ''}
                onValueChange={(value) => {
                  setSelectedRoomId(value);
                  setUseDifferentRoom(false);
                }}
              >
                {assignedRooms.map((room) => (
                  <div key={room.room_id} className="relative">
                    <RadioGroupItem
                      value={room.room_id}
                      id={`room-${room.room_id}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`room-${room.room_id}`}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                        "hover:border-primary/50 hover:bg-primary/5",
                        selectedRoomId === room.room_id
                          ? "border-primary bg-primary/10"
                          : "border-border"
                      )}
                    >
                      <div>
                        <p className="font-medium">{room.room_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.floor_name} • {room.building_name}
                        </p>
                      </div>
                      {selectedRoomId === room.room_id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
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
                className="min-h-[150px] pr-12"
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
        "p-4 cursor-pointer transition-all duration-200",
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
