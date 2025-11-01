import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import { cn } from '@/lib/utils';

interface ExpirationRenewalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: {
    id: string;
    occupant_name: string;
    room_number: string;
    assignment_type: string;
    expiration_date?: string;
  };
  onRenew: (data: {
    newExpirationDate: Date;
    renewalPeriod: string;
    notes: string;
  }) => Promise<void>;
}

export function ExpirationRenewalDialog({
  isOpen,
  onClose,
  assignment,
  onRenew
}: ExpirationRenewalDialogProps) {
  const [newExpirationDate, setNewExpirationDate] = useState<Date>();
  const [renewalPeriod, setRenewalPeriod] = useState('1-year');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentExpiration = assignment.expiration_date 
    ? new Date(assignment.expiration_date)
    : null;

  const isExpired = currentExpiration && currentExpiration < new Date();
  const isExpiringSoon = currentExpiration && 
    currentExpiration <= addMonths(new Date(), 1) && 
    !isExpired;

  const presetPeriods = [
    { value: '3-months', label: '3 Months', months: 3 },
    { value: '6-months', label: '6 Months', months: 6 },
    { value: '1-year', label: '1 Year', months: 12 },
    { value: '2-years', label: '2 Years', months: 24 },
    { value: 'custom', label: 'Custom Date', months: 0 }
  ];

  const handlePresetChange = (period: string) => {
    setRenewalPeriod(period);
    if (period !== 'custom') {
      const preset = presetPeriods.find(p => p.value === period);
      if (preset) {
        const baseDate = currentExpiration && currentExpiration > new Date() 
          ? currentExpiration 
          : new Date();
        setNewExpirationDate(addMonths(baseDate, preset.months));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpirationDate) return;

    setIsLoading(true);
    try {
      await onRenew({
        newExpirationDate,
        renewalPeriod,
        notes
      });
      onClose();
    } catch (error) {
      console.error('Failed to renew assignment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set default expiration date when dialog opens
  React.useEffect(() => {
    if (isOpen && !newExpirationDate) {
      handlePresetChange('1-year');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {isExpired ? 'Renew Expired Assignment' : 'Extend Assignment'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Assignment Info */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="text-sm">
              <span className="font-medium">{assignment.occupant_name}</span>
              <span className="text-muted-foreground"> → Room {assignment.room_number}</span>
            </div>
            <div className="text-sm text-muted-foreground capitalize">
              {assignment.assignment_type.replace('_', ' ')}
            </div>
            
            {currentExpiration && (
              <div className={cn(
                "text-sm flex items-center gap-1",
                isExpired ? "text-destructive" : isExpiringSoon ? "text-yellow-600" : "text-muted-foreground"
              )}>
                {isExpired ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {isExpired ? 'Expired: ' : 'Current expiration: '}
                {format(currentExpiration, 'MMM d, yyyy')}
              </div>
            )}
          </div>

          {/* Renewal Period */}
          <div className="space-y-2">
            <Label>Renewal Period</Label>
            <div className="grid grid-cols-2 gap-2">
              {presetPeriods.map((period) => (
                <Button
                  key={period.value}
                  type="button"
                  variant={renewalPeriod === period.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetChange(period.value)}
                  className="text-xs"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>

          {/* New Expiration Date */}
          <div className="space-y-2">
            <Label>New Expiration Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newExpirationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newExpirationDate ? format(newExpirationDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newExpirationDate}
                  onSelect={setNewExpirationDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this renewal..."
              className="min-h-[80px]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!newExpirationDate || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Processing...' : 'Renew Assignment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}