import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Save, Package, Camera, Wrench } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface RoomQuickEditSheetProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomType: string;
  defaultSection?: string;
}

export function RoomQuickEditSheet({ open, onClose, roomId, roomType, defaultSection = 'basic' }: RoomQuickEditSheetProps) {
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [storageNotes, setStorageNotes] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([defaultSection]));
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', roomId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room updated successfully');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update room: ${error.message}`);
    }
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleSave = () => {
    const updates: Record<string, unknown> = {};
    if (description) updates.description = description;
    if (phoneNumber) updates.phone_number = phoneNumber;
    if (storageNotes) updates.storage_notes = storageNotes;
    
    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates);
    } else {
      onClose();
    }
  };

  const isCourtroom = roomType === 'courtroom';

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Quick Edit Room Details</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {/* Basic Info - Always Expanded */}
          <Collapsible
            open={expandedSections.has('basic')}
            onOpenChange={() => toggleSection('basic')}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent hover:bg-accent/80 transition-colors">
                <div className="flex items-center gap-3">
                  {expandedSections.has('basic') ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  <span className="font-medium">Basic Information</span>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="min-h-24 touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="555-0123"
                  className="touch-manipulation"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Storage Options */}
          <Collapsible
            open={expandedSections.has('storage')}
            onOpenChange={() => toggleSection('storage')}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  {expandedSections.has('storage') ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  <Package className="h-4 w-4" />
                  <span className="font-medium">Storage Options</span>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storageNotes">Storage Notes</Label>
                <Textarea
                  id="storageNotes"
                  value={storageNotes}
                  onChange={(e) => setStorageNotes(e.target.value)}
                  placeholder="Storage details..."
                  className="min-h-20 touch-manipulation"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Courtroom Photos - Only for courtrooms */}
          {isCourtroom && (
            <Collapsible
              open={expandedSections.has('photos')}
              onOpenChange={() => toggleSection('photos')}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-3">
                    {expandedSections.has('photos') ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <Camera className="h-4 w-4" />
                    <span className="font-medium">Courtroom Photos</span>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Photo upload coming soon
                </p>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Advanced Settings */}
          <Collapsible
            open={expandedSections.has('advanced')}
            onOpenChange={() => toggleSection('advanced')}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  {expandedSections.has('advanced') ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  <Wrench className="h-4 w-4" />
                  <span className="font-medium">Advanced Settings</span>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4">
              <p className="text-sm text-muted-foreground">
                For advanced settings, use the full edit wizard
              </p>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Actions */}
        <div className="border-t pt-4 pb-safe">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="flex-1 h-12 touch-manipulation"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 h-12 touch-manipulation"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
