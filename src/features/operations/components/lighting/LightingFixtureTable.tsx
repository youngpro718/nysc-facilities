import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, ClipboardList, PlayCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { LightingFixture } from '@/features/lighting/services/lightingService';
import { FixtureDetailSheet } from './FixtureDetailSheet';

interface LightingFixtureTableProps {
  fixtures: LightingFixture[];
  isLoading: boolean;
  onRefresh: () => void;
  /** Whether any fixtures at all are tracked system-wide — distinguishes
   *  "nothing wrong" from "nothing tracked yet" in the empty state. */
  hasTrackedFixtures?: boolean;
  onStartWalkthrough?: () => void;
}

export function LightingFixtureTable({ fixtures, isLoading, onRefresh, hasTrackedFixtures = true, onStartWalkthrough }: LightingFixtureTableProps) {
  const [selectedFixture, setSelectedFixture] = useState<LightingFixture | null>(null);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading fixtures...
      </div>
    );
  }

  if (fixtures.length === 0 && !hasTrackedFixtures) {
    return (
      <div className="p-12 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No fixtures tracked yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This isn't "all clear" — nothing's been logged, so outages can't show up here yet.
        </p>
        {onStartWalkthrough && (
          <Button size="sm" onClick={onStartWalkthrough}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Start a walkthrough
          </Button>
        )}
      </div>
    );
  }

  if (fixtures.length === 0) {
    return (
      <div className="p-12 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">All fixtures operational</h3>
        <p className="text-sm text-muted-foreground">
          No lighting issues to display
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Location</TableHead>
            <TableHead>Fixture Name</TableHead>
            <TableHead>Issue Type</TableHead>
            <TableHead>Electrician</TableHead>
            <TableHead>Reported</TableHead>
            <TableHead>Last Checked</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fixtures.map((fixture) => (
            <TableRow
              key={fixture.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelectedFixture(fixture)}
            >
              <TableCell className="font-medium">
                {fixture.room_number || 'Unknown'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {fixture.emergency_circuit && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  {fixture.name}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={fixture.ballast_issue ? 'destructive' : 'secondary'}>
                  {fixture.ballast_issue ? 'Ballast' : fixture.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {fixture.requires_electrician && (
                  <Badge variant="destructive">Required</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {fixture.reported_out_date
                  ? formatDistanceToNow(new Date(fixture.reported_out_date), { addSuffix: true })
                  : '—'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {fixture.times_scanned > 0 ? `${fixture.times_scanned} scans` : 'Never'}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFixture(fixture);
                  }}
                >
                  Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedFixture && (
        <FixtureDetailSheet
          fixture={selectedFixture}
          open={!!selectedFixture}
          onOpenChange={(open) => !open && setSelectedFixture(null)}
          onUpdate={onRefresh}
        />
      )}
    </>
  );
}
