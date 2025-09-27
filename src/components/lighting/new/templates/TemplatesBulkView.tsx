import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Copy, 
  Plus,
  Trash2,
  Edit,
  Play,
  Package,
  Route,
  Building
} from 'lucide-react';
import { LightingTemplateManager } from '../../templates/LightingTemplateManager';

export function TemplatesBulkView() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Mock templates data
  const templates = [
    {
      id: 'template-main-hall',
      name: 'Main Hallway Standard',
      type: 'main_hallway',
      fixtureCount: 15,
      bulbsPerFixture: 2,
      description: 'Standard main hallway configuration with 15 fixtures',
      floors: 'All floors',
      usage: 12
    },
    {
      id: 'template-elevator',
      name: 'Elevator Bank',
      type: 'elevator_bank',
      fixtureCount: 3,
      bulbsPerFixture: 2,
      description: 'Standard elevator bank lighting',
      floors: 'Floors 13-16',
      usage: 8
    },
    {
      id: 'template-special-13',
      name: '13th Floor Special North',
      type: 'special_floor',
      fixtureCount: 8,
      bulbsPerFixture: 2,
      description: 'Special north-end configuration for 13th floor',
      floors: 'Floor 13 only',
      usage: 1
    },
    {
      id: 'template-special-16',
      name: '16th Floor Special North',
      type: 'special_floor',
      fixtureCount: 6,
      bulbsPerFixture: 2,
      description: 'Special north-end configuration for 16th floor',
      floors: 'Floor 16 only',
      usage: 1
    }
  ];

  // Mock bulk operations
  const bulkOperations = [
    {
      id: 'bulk-1',
      name: 'Replace All Main Hallway Bulbs',
      target: 'All main hallways',
      operation: 'Maintenance',
      status: 'scheduled',
      date: '2024-02-01',
      affectedFixtures: 75
    },
    {
      id: 'bulk-2',
      name: 'LED Upgrade - 17th Floor',
      target: '17th Floor all fixtures',
      operation: 'Upgrade',
      status: 'in_progress',
      date: '2024-01-25',
      affectedFixtures: 15
    },
    {
      id: 'bulk-3',
      name: 'Quarterly Inspection - Elevator Banks',
      target: 'All elevator banks',
      operation: 'Inspection',
      status: 'completed',
      date: '2024-01-15',
      affectedFixtures: 18
    }
  ];

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'main_hallway': return Route;
      case 'elevator_bank': return Building;
      case 'special_floor': return Settings;
      default: return Package;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates & Bulk Operations</h2>
          <p className="text-muted-foreground">
            Manage lighting templates and perform bulk operations by hallway
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Lighting Templates</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="manager">Template Manager</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => {
              const IconComponent = getTemplateIcon(template.type);
              return (
                <Card key={template.id} className="hover:bg-muted/50 cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      {template.name}
                      <Badge variant="outline">{template.usage} uses</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-medium">Fixtures:</span> {template.fixtureCount}
                      </div>
                      <div>
                        <span className="font-medium">Bulbs each:</span> {template.bulbsPerFixture}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Applies to:</span> {template.floors}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4 mr-1" />
                        Apply
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-4 w-4 mr-1" />
                        Clone
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Bulk Operations</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Bulk Operation
            </Button>
          </div>

          <div className="space-y-3">
            {bulkOperations.map((operation) => (
              <Card key={operation.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{operation.name}</h4>
                        <Badge className={getStatusColor(operation.status)}>
                          {operation.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {operation.target} • {operation.affectedFixtures} fixtures affected
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {operation.operation} • {operation.date}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      {operation.status === 'scheduled' && (
                        <Button size="sm">
                          Execute
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="manager">
          <LightingTemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}