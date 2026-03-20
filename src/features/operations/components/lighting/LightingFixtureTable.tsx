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
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { LightingFixture } from '@/features/lighting/services/lightingService';
import { FixtureDetailSheet } from './FixtureDetailSheet';

interface LightingFixtureTableProps {
  fixtures: LightingFixture[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function LightingFixtureTable({ fixtures, isLoading, onRefresh }: LightingFixtureTableProps) {
  const [selectedFixture, setSelectedFixture] = useState<LightingFixture | null>(null);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading fixtures...
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
                {fixture.scan_count > 0 ? `${fixture.scan_count} scans` : 'Never'}
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
