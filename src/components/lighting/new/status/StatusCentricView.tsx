import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings,
  Filter,
  Download,
  Wrench
} from 'lucide-react';

export function StatusCentricView() {
  const [selectedFixtures, setSelectedFixtures] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterHallway, setFilterHallway] = useState<string>('all');

  // Mock data organized by status
  const fixturesByStatus = {
    functional: [
      {
        id: 'fix-1',
        name: 'Main Hall Light 01',
        location: '13th Floor - Main Hallway',
        hallway: 'main',
        position: 1,
        bulbs: 2,
        technology: 'LED',
        lastMaintenance: '2024-01-15'
      },
      {
        id: 'fix-2',
        name: 'Main Hall Light 02',
        location: '13th Floor - Main Hallway',
        hallway: 'main',
        position: 2,
        bulbs: 2,
        technology: 'LED',
        lastMaintenance: '2024-01-15'
      }
    ],
    non_functional: [
      {
        id: 'fix-broken-1',
        name: 'Main Hall Light 15',
        location: '13th Floor - Main Hallway',
        hallway: 'main',
        position: 15,
        bulbs: 2,
        technology: 'LED',
        reportedDate: '2024-01-20',
        issueType: 'Bulb replacement needed'
      },
      {
        id: 'fix-broken-2',
        name: 'Elevator Bank 2 Light 01',
        location: '17th Floor - Elevator Bank 2',
        hallway: 'center_west',
        position: 1,
        bulbs: 2,
        technology: 'Fluorescent',
        reportedDate: '2024-01-18',
        issueType: 'Electrical issue'
      }
    ],
    maintenance_needed: [
      {
        id: 'fix-maint-1',
        name: 'North East Light 03',
        location: '13th Floor - North East',
        hallway: 'north_east',
        position: 3,
        bulbs: 2,
        technology: 'LED',
        scheduledDate: '2024-02-01',
        maintenanceType: 'Routine inspection'
      }
    ],
    scheduled_replacement: [
      {
        id: 'fix-sched-1',
        name: 'Main Hall Light 08',
        location: '14th Floor - Main Hallway',
        hallway: 'main',
        position: 8,
        bulbs: 2,
        technology: 'Fluorescent',
        scheduledDate: '2024-02-15',
        replacementType: 'LED upgrade'
      }
    ]
  };

  const statusConfig = {
    functional: {
      label: 'Functional',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      count: fixturesByStatus.functional.length
    },
    non_functional: {
      label: 'Non-Functional',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800',
      count: fixturesByStatus.non_functional.length
    },
    maintenance_needed: {
      label: 'Maintenance Needed',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      count: fixturesByStatus.maintenance_needed.length
    },
    scheduled_replacement: {
      label: 'Scheduled Replacement',
      icon: Settings,
      color: 'bg-blue-100 text-blue-800',
      count: fixturesByStatus.scheduled_replacement.length
    }
  };

  const hallwayOptions = [
    { value: 'all', label: 'All Hallways' },
    { value: 'main', label: 'Main Hallway' },
    { value: 'north_east', label: 'North East' },
    { value: 'north_west', label: 'North West' },
    { value: 'center_east', label: 'Center East' },
    { value: 'center_west', label: 'Center West' }
  ];

  const toggleFixture = (fixtureId: string) => {
    const newSelected = new Set(selectedFixtures);
    if (newSelected.has(fixtureId)) {
      newSelected.delete(fixtureId);
    } else {
      newSelected.add(fixtureId);
    }
    setSelectedFixtures(newSelected);
  };

  const getFilteredFixtures = (fixtures: any[], status: string) => {
    if (filterHallway === 'all') return fixtures;
    return fixtures.filter(fixture => fixture.hallway === filterHallway);
  };

  const renderFixtureCard = (fixture: any, status: string) => (
    <div key={fixture.id} className="border rounded-lg p-4 hover:bg-muted/50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selectedFixtures.has(fixture.id)}
            onCheckedChange={() => toggleFixture(fixture.id)}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{fixture.name}</h4>
              <Badge variant="outline" className="text-xs">
                Pos {fixture.position}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {fixture.location}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{fixture.bulbs} bulbs</span>
              <span>{fixture.technology}</span>
              {fixture.lastMaintenance && (
                <span>Last: {fixture.lastMaintenance}</span>
              )}
              {fixture.reportedDate && (
                <span className="text-red-600">Reported: {fixture.reportedDate}</span>
              )}
              {fixture.scheduledDate && (
                <span className="text-blue-600">Scheduled: {fixture.scheduledDate}</span>
              )}
            </div>
            {fixture.issueType && (
              <div className="mt-2 text-sm text-red-600">
                Issue: {fixture.issueType}
              </div>
            )}
            {fixture.maintenanceType && (
              <div className="mt-2 text-sm text-yellow-600">
                {fixture.maintenanceType}
              </div>
            )}
            {fixture.replacementType && (
              <div className="mt-2 text-sm text-blue-600">
                {fixture.replacementType}
              </div>
            )}
          </div>
        </div>
        <Button size="sm" variant="outline">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Status-Based Lighting Management</h2>
          <p className="text-muted-foreground">
            Fixtures organized by functional status across all hallways
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedFixtures.size > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-muted-foreground">
                {selectedFixtures.size} selected
              </span>
              <Button size="sm" variant="outline">
                <Wrench className="h-4 w-4 mr-1" />
                Bulk Action
              </Button>
            </div>
          )}
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterHallway} onValueChange={setFilterHallway}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hallwayOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => (
          <Card key={key} className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterStatus(key)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <config.icon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{config.count}</div>
                  <div className="text-sm text-muted-foreground">{config.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status-Grouped Fixtures */}
      {Object.entries(statusConfig)
        .filter(([key]) => filterStatus === 'all' || filterStatus === key)
        .map(([status, config]) => {
          const fixtures = getFilteredFixtures(fixturesByStatus[status as keyof typeof fixturesByStatus], status);
          
          if (fixtures.length === 0) return null;

          return (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <config.icon className="h-5 w-5" />
                  {config.label}
                  <Badge className={config.color}>
                    {fixtures.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fixtures.map(fixture => renderFixtureCard(fixture, status))}
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}