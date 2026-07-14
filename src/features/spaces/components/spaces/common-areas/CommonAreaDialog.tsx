import { FormEvent, useEffect, useState } from 'react';
import { ReloadIcon } from '@radix-ui/react-icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BuildingSelector } from '../BuildingSelector';
import { FloorSelector } from '../FloorSelector';
import {
  COMMON_AREA_TYPES,
  commonAreaTypeLabel,
  type CommonArea,
  type CommonAreaInput,
  type CommonAreaType,
} from './types';

interface CommonAreaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area?: CommonArea | null;
  isPending: boolean;
  onSave: (input: CommonAreaInput) => Promise<void>;
}

export function CommonAreaDialog({
  open,
  onOpenChange,
  area,
  isPending,
  onSave,
}: CommonAreaDialogProps) {
  const [buildingId, setBuildingId] = useState('all');
  const [floorId, setFloorId] = useState('all');
  const [name, setName] = useState('');
  const [areaType, setAreaType] = useState<CommonAreaType>('hallway');
  const [description, setDescription] = useState('');
  const [coolerCount, setCoolerCount] = useState(0);
  const [coolerNotes, setCoolerNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setBuildingId(area?.floor.building.id ?? 'all');
    setFloorId(area?.floor_id ?? 'all');
    setName(area?.name ?? '');
    setAreaType(area?.area_type ?? 'hallway');
    setDescription(area?.description ?? '');
    setCoolerCount(area?.water_cooler_count ?? 0);
    setCoolerNotes(area?.water_cooler_notes ?? '');
  }, [area, open]);

  const handleBuildingChange = (value: string) => {
    setBuildingId(value);
    setFloorId('all');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (buildingId === 'all' || floorId === 'all' || !name.trim()) return;

    await onSave({
      floor_id: floorId,
      name: name.trim(),
      area_type: areaType,
      status: area?.status ?? 'active',
      description: description.trim() || null,
      water_cooler_count: Math.max(0, Math.min(50, Math.trunc(coolerCount))),
      water_cooler_notes: coolerCount > 0 ? coolerNotes.trim() || null : null,
    });
  };

  const isValid = buildingId !== 'all'
    && floorId !== 'all'
    && name.trim().length > 0
    && Number.isFinite(coolerCount)
    && coolerCount >= 0
    && coolerCount <= 50;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{area ? 'Edit common area' : 'Add common area'}</DialogTitle>
            <DialogDescription>
              Use common areas for hallways, entrances, lobbies, mezzanines, and other locations that are not rooms.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Building</Label>
              <BuildingSelector value={buildingId} onChange={handleBuildingChange} className="w-full" />
              {buildingId === 'all' && <p className="text-xs text-muted-foreground">Choose a building.</p>}
            </div>
            <div className="space-y-2">
              <Label>Floor</Label>
              <FloorSelector buildingId={buildingId} value={floorId} onChange={setFloorId} className="w-full" />
              {buildingId !== 'all' && floorId === 'all' && <p className="text-xs text-muted-foreground">Choose a floor.</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div className="space-y-2">
              <Label htmlFor="common-area-name">Name</Label>
              <Input
                id="common-area-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="North Hallway"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="common-area-type">Area type</Label>
              <Select value={areaType} onValueChange={(value) => setAreaType(value as CommonAreaType)}>
                <SelectTrigger id="common-area-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_AREA_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{commonAreaTypeLabel(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="common-area-description">Location details</Label>
            <Textarea
              id="common-area-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional directions or identifying details"
              rows={2}
            />
          </div>

          <div className="rounded-lg border border-sky-200/70 bg-sky-50/50 p-4 dark:border-sky-900 dark:bg-sky-950/20">
            <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
              <div className="space-y-2">
                <Label htmlFor="common-area-coolers">Water coolers</Label>
                <Input
                  id="common-area-coolers"
                  type="number"
                  min={0}
                  max={50}
                  inputMode="numeric"
                  className="font-mono"
                  value={coolerCount}
                  onChange={(event) => setCoolerCount(Number(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="common-area-cooler-notes">Placement notes</Label>
                <Input
                  id="common-area-cooler-notes"
                  value={coolerNotes}
                  onChange={(event) => setCoolerNotes(event.target.value)}
                  placeholder="Optional, e.g. beside the north elevators"
                  disabled={coolerCount < 1}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isPending} className="active:scale-[0.98]">
              {isPending && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              {area ? 'Save changes' : 'Add common area'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
