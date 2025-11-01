import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Lightbulb, 
  Route,
  Plus,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { HallwayLightingDashboard } from '../hallway/HallwayLightingDashboard';
import { LightingTemplateManager } from '../templates/LightingTemplateManager';

export const EnhancedHallwayLightingPage: React.FC = () => {
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');

  // Mock data - in real implementation, this would come from the database
  const floors = [
    { id: '1', number: 13, name: '13th Floor', has_special_config: true },
    { id: '2', number: 14, name: '14th Floor', has_special_config: false },
    { id: '3', number: 15, name: '15th Floor', has_special_config: false },
    { id: '4', number: 16, name: '16th Floor', has_special_config: true },
    { id: '5', number: 17, name: '17th Floor', has_special_config: false, elevator_banks: 0 },
  ];

  const hallwaySections = [
    { value: 'main', label: 'Main Hallway', description: '15 fixtures, 2 bulbs each' },
    { value: 'north_east', label: 'North East', description: 'Private hallway extension' },
    { value: 'north_west', label: 'North West', description: 'Private hallway extension' },
    { value: 'center_east', label: 'Center East', description: 'Private hallway extension' },
    { value: 'center_west', label: 'Center West', description: 'Private hallway extension' },
    { value: 'south_east', label: 'South East', description: 'Private hallway extension' },
    { value: 'south_west', label: 'South West', description: 'Private hallway extension' },
  ];

  const mockHallwayStats = [
    {
      hallway_id: '1',
      hallway_name: 'Main Hallway',
      section: 'main',
      total_fixtures: 15,
      functional_fixtures: 14,
      non_functional_fixtures: 1,
      maintenance_needed: 2,
      total_bulbs: 30,
      functional_bulbs: 28,
    },
    {
      hallway_id: '2',
      hallway_name: 'Elevator Bank 1',
      section: 'center_east',
      total_fixtures: 3,
      functional_fixtures: 3,
      non_functional_fixtures: 0,
      maintenance_needed: 0,
      total_bulbs: 6,
      functional_bulbs: 6,
    },
    {
      hallway_id: '3',
      hallway_name: 'Elevator Bank 2',
      section: 'center_west',
      total_fixtures: 3,
      functional_fixtures: 2,
      non_functional_fixtures: 1,
      maintenance_needed: 1,
      total_bulbs: 6,
      functional_bulbs: 4,
    },
  ];

  const selectedFloorData = floors.find(f => f.id === selectedFloor);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Hallway Lighting System</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive tracking for main hallways, elevator banks, and special floor configurations
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Hallway Section
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">Main Hallways</h3>
                <p className="text-sm text-gray-600">15 fixtures × 2 bulbs each</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold">Elevator Banks</h3>
                <p className="text-sm text-gray-600">3 fixtures × 2 bulbs each</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Route className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold">Directional Sections</h3>
                <p className="text-sm text-gray-600">North, Center, South areas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floor Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Floor Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Floor</label>
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a floor to view" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((floor) => (
                    <SelectItem key={floor.id} value={floor.id}>
                      <div className="flex items-center gap-2">
                        {floor.name}
                        {floor.has_special_config && (
                          <Badge variant="secondary">Special Config</Badge>
                        )}
                        {floor.elevator_banks === 0 && (
                          <Badge variant="outline">No Elevators</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Hallway Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section to focus on" />
                </SelectTrigger>
                <SelectContent>
                  {hallwaySections.map((section) => (
                    <SelectItem key={section.value} value={section.value}>
                      <div>
                        <div className="font-medium">{section.label}</div>
                        <div className="text-xs text-gray-500">{section.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedFloorData && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{selectedFloorData.name}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• Elevator Banks: {selectedFloorData.elevator_banks ?? 2}</div>
                <div>• Special Configuration: {selectedFloorData.has_special_config ? 'Yes' : 'No'}</div>
                {selectedFloorData.has_special_config && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Requires additional north-end lighting</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floor Dashboard */}
      {selectedFloorData && (
        <HallwayLightingDashboard
          floorId={selectedFloorData.id}
          floorNumber={selectedFloorData.number}
          stats={mockHallwayStats}
        />
      )}

      {/* Template Manager */}
      {!selectedFloor && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LightingTemplateManager />
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Lightbulb className="h-4 w-4 mr-2" />
                Generate Fixtures for New Floor
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Manage Lighting Templates
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Route className="h-4 w-4 mr-2" />
                Configure Hallway Connections
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};