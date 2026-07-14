import { useMemo, useState } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  SewingPinIcon,
  ExclamationTriangleIcon,
} from '@radix-ui/react-icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BuildingSelector } from '../BuildingSelector';
import { FloorSelector } from '../FloorSelector';
import { useRolePermissions } from '@features/auth/hooks/useRolePermissions';
import { CommonAreaCard } from './CommonAreaCard';
import { CommonAreaDialog } from './CommonAreaDialog';
import { useCommonAreas } from './useCommonAreas';
import type { CommonArea, CommonAreaInput } from './types';

interface AreaGroup {
  key: string;
  buildingName: string;
  floorName: string;
  floorNumber: number;
  areas: CommonArea[];
}

export function CommonAreasPage() {
  const [buildingId, setBuildingId] = useState('all');
  const [floorId, setFloorId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<CommonArea | null>(null);
  const [deletingArea, setDeletingArea] = useState<CommonArea | null>(null);
  const { canAdmin } = useRolePermissions();
  const canManage = canAdmin('spaces');
  const {
    data: areas = [],
    isLoading,
    error,
    createArea,
    updateArea,
    deleteArea,
  } = useCommonAreas({ buildingId, floorId });

  const filteredAreas = useMemo(() => {
    const needle = searchQuery.trim().toLocaleLowerCase();
    if (!needle) return areas;
    return areas.filter((area) => [
      area.name,
      area.area_type,
      area.description,
      area.water_cooler_notes,
      area.floor.name,
      area.floor.building.name,
    ].some((value) => value?.toLocaleLowerCase().includes(needle)));
  }, [areas, searchQuery]);

  const groups = useMemo(() => {
    const grouped = new Map<string, AreaGroup>();
    filteredAreas.forEach((area) => {
      const key = `${area.floor.building.id}:${area.floor_id}`;
      const existing = grouped.get(key) ?? {
        key,
        buildingName: area.floor.building.name,
        floorName: area.floor.name,
        floorNumber: area.floor.floor_number,
        areas: [],
      };
      existing.areas.push(area);
      grouped.set(key, existing);
    });
    return Array.from(grouped.values())
      .sort((a, b) => a.buildingName.localeCompare(b.buildingName)
        || a.floorNumber - b.floorNumber)
      .map((group) => ({
        ...group,
        areas: group.areas.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [filteredAreas]);

  const totalCoolers = filteredAreas.reduce((sum, area) => sum + area.water_cooler_count, 0);

  const handleBuildingChange = (value: string) => {
    setBuildingId(value);
    setFloorId('all');
  };

  const openCreateDialog = () => {
    setEditingArea(null);
    setDialogOpen(true);
  };

  const openEditDialog = (area: CommonArea) => {
    setEditingArea(area);
    setDialogOpen(true);
  };

  const handleSave = async (input: CommonAreaInput) => {
    try {
      if (editingArea) {
        await updateArea.mutateAsync({ id: editingArea.id, input });
      } else {
        await createArea.mutateAsync(input);
      }
      setDialogOpen(false);
      setEditingArea(null);
    } catch {
      // Mutation callbacks provide the actionable error message.
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertDescription>Common areas could not be loaded. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid gap-3 rounded-lg border bg-card p-3 lg:grid-cols-[minmax(220px,1fr)_minmax(180px,0.8fr)_minmax(240px,1.2fr)_auto]">
        <BuildingSelector value={buildingId} onChange={handleBuildingChange} className="w-full" />
        <FloorSelector buildingId={buildingId} value={floorId} onChange={setFloorId} className="w-full" />
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search common areas"
            className="pl-9"
            aria-label="Search common areas"
          />
        </div>
        {canManage && (
          <Button type="button" onClick={openCreateDialog} className="gap-2 active:scale-[0.98]">
            <PlusIcon className="h-4 w-4" />
            Add area
          </Button>
        )}
      </div>

      {!isLoading && filteredAreas.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-sm text-muted-foreground">
          <span>{filteredAreas.length} {filteredAreas.length === 1 ? 'area' : 'areas'}</span>
          <span>{totalCoolers} water {totalCoolers === 1 ? 'cooler' : 'coolers'}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((group) => (
            <div key={group} className="rounded-lg border p-5">
              <Skeleton className="mb-5 h-5 w-52" />
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SewingPinIcon className="h-5 w-5" />
          </div>
          <h3 className="font-medium">No common areas found</h3>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            {searchQuery || buildingId !== 'all'
              ? 'Adjust the building, floor, or search filters.'
              : 'Hallways, entrances, lobbies, and mezzanines will appear here instead of in the room list.'}
          </p>
          {canManage && !searchQuery && buildingId === 'all' && (
            <Button type="button" variant="outline" onClick={openCreateDialog} className="mt-5 gap-2 active:scale-[0.98]">
              <PlusIcon className="h-4 w-4" />
              Add common area
            </Button>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {groups.map((group) => (
            <section key={group.key} className="rounded-lg border bg-card px-4 py-4 sm:px-5">
              <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b pb-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {group.buildingName}
                  </p>
                  <h3 className="mt-1 text-base font-semibold tracking-tight">{group.floorName}</h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  {group.areas.length} {group.areas.length === 1 ? 'area' : 'areas'}
                </span>
              </header>
              <div>
                {group.areas.map((area) => (
                  <CommonAreaCard
                    key={area.id}
                    area={area}
                    canManage={canManage}
                    onEdit={openEditDialog}
                    onDelete={setDeletingArea}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <CommonAreaDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingArea(null);
        }}
        area={editingArea}
        isPending={createArea.isPending || updateArea.isPending}
        onSave={handleSave}
      />

      <AlertDialog open={!!deletingArea} onOpenChange={(open) => !open && setDeletingArea(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete common area?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingArea?.name} will be removed from its floor, including its water-cooler location record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteArea.isPending}
              onClick={async () => {
                if (!deletingArea) return;
                try {
                  await deleteArea.mutateAsync(deletingArea.id);
                  setDeletingArea(null);
                } catch {
                  // Mutation callbacks provide the actionable error message.
                }
              }}
            >
              Delete area
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
