import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lightbulb, MapPin, Zap, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { LightingFixture, LightStatus } from '@/features/lighting/services/lightingService';
import { useUpdateFixtureStatus } from '@/features/lighting/hooks/useLightingData';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface FixtureDetailSheetProps {
  fixture: LightingFixture;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function FixtureDetailSheet({ fixture, open, onOpenChange, onUpdate }: FixtureDetailSheetProps) {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState<LightStatus>(fixture.status);
  const [notes, setNotes] = useState(fixture.notes || '');
  const [isEditing, setIsEditing] = useState(false);

  const updateMutation = useUpdateFixtureStatus();

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        fixtureId: fixture.id,
        payload: {
          status,
          notes,
          resolved_at: status === 'functional' ? new Date().toISOString() : undefined,
        },
      });
      toast.success('Fixture status updated');
      setIsEditing(false);
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update fixture status');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            {fixture.name}
          </SheetTitle>
          <SheetDescription>
            Fixture details and maintenance history
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant={fixture.status === 'functional' ? 'default' : 'destructive'}>
              {fixture.status.replace('_', ' ')}
            </Badge>
            {fixture.emergency_circuit && (
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                Emergency Circuit
              </Badge>
            )}
            {fixture.requires_electrician && (
              <Badge variant="destructive">Electrician Required</Badge>
            )}
          </div>

          <Separator />

          {/* Location Info */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-muted-foreground">Room</Label>
                <p className="font-medium">{fixture.room_number || '—'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Position</Label>
                <p className="font-medium capitalize">{fixture.position}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Technical Details */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Technical Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="font-medium capitalize">{fixture.type.replace('_', ' ')}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Technology</Label>
                <p className="font-medium">{fixture.technology || '—'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Bulb Count</Label>
                <p className="font-medium">{fixture.bulb_count}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Scan Count</Label>
                <p className="font-medium">{fixture.scan_count}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Maintenance History */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Maintenance History
            </h4>
            <div className="space-y-2 text-sm">
              {fixture.reported_out_date && (
                <div>
                  <Label className="text-muted-foreground">Reported Out</Label>
                  <p className="font-medium">
                    {format(new Date(fixture.reported_out_date), 'PPp')}
                  </p>
                </div>
              )}
              {fixture.replaced_date && (
                <div>
                  <Label className="text-muted-foreground">Last Replaced</Label>
                  <p className="font-medium">
                    {format(new Date(fixture.replaced_date), 'PPp')}
                  </p>
                </div>
              )}
              {!fixture.reported_out_date && !fixture.replaced_date && (
                <p className="text-muted-foreground">No maintenance history</p>
              )}
            </div>
          </div>

          {/* Admin Update Form */}
          {isAdmin && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Update Status
                </h4>

                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
                    Edit Status
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(value) => setStatus(value as LightStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="functional">Functional</SelectItem>
                          <SelectItem value="non_functional">Non-Functional</SelectItem>
                          <SelectItem value="maintenance_needed">Maintenance Needed</SelectItem>
                          <SelectItem value="scheduled_replacement">Scheduled Replacement</SelectItem>
                          <SelectItem value="pending_maintenance">Pending Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add maintenance notes..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="flex-1"
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          setStatus(fixture.status);
                          setNotes(fixture.notes || '');
                        }}
                        variant="outline"
                        disabled={updateMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Current Notes (if any) */}
          {fixture.notes && !isEditing && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-muted-foreground">Notes</Label>
                <p className="text-sm">{fixture.notes}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
