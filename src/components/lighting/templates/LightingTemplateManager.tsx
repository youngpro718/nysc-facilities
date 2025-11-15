import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Lightbulb, Building2, Settings } from 'lucide-react';
import { useLightingTemplates, useCreateFixturesFromTemplate } from '@/hooks/useLightingTemplates';
import { LightingTemplate } from '@/types/lightingTemplates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LightingTemplateManagerProps {
  hallwayId?: string;
  floorNumber?: number;
}

export const LightingTemplateManager: React.FC<LightingTemplateManagerProps> = ({
  hallwayId,
  floorNumber,
}) => {
  const { data: templates, isLoading } = useLightingTemplates();
  const createFixtures = useCreateFixturesFromTemplate();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [bankNumber, setBankNumber] = useState<number>(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateFixtures = () => {
    if (!selectedTemplate || !hallwayId || !floorNumber) return;

    createFixtures.mutate({
      templateId: selectedTemplate,
      hallwayId,
      floorNumber,
      bankNumber: bankNumber,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setSelectedTemplate('');
        setBankNumber(1);
      },
    });
  };

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'main_hallway': return 'bg-blue-100 text-blue-800';
      case 'elevator_bank': return 'bg-green-100 text-green-800';
      case 'special_floor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'main_hallway': return <Building2 className="h-4 w-4" />;
      case 'elevator_bank': return <Settings className="h-4 w-4" />;
      case 'special_floor': return <Lightbulb className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Lighting Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {templates?.map((template: LightingTemplate) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTemplateIcon(template.template_type)}
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-gray-600">
                      {template.fixture_count} fixtures × {template.bulbs_per_fixture} bulbs each
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getTemplateTypeColor(template.template_type)}>
                    {template.template_type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  {hallwayId && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Apply
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Apply Lighting Template</DialogTitle>
                          <DialogDescription>
                            Generate fixtures for this hallway using the "{template.name}" template.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Template</Label>
                            <div className="mt-1 p-2 bg-gray-50 rounded">
                              {template.name} - {template.fixture_count} fixtures × {template.bulbs_per_fixture} bulbs
                            </div>
                          </div>
                          
                          {template.template_type === 'elevator_bank' && (
                            <div>
                              <Label htmlFor="bank-number">Elevator Bank Number</Label>
                              <Select 
                                value={bankNumber.toString()} 
                                onValueChange={(value) => setBankNumber(parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Bank 1</SelectItem>
                                  <SelectItem value="2">Bank 2</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm text-blue-700">
                              This will create {template.fixture_count} fixtures with {template.bulbs_per_fixture} bulbs each 
                              for Floor {floorNumber}.
                            </p>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleCreateFixtures}
                              disabled={createFixtures.isPending}
                            >
                              {createFixtures.isPending ? 'Creating...' : 'Create Fixtures'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
              
              {template.special_config.floor && (
                <div className="mt-2 text-sm text-gray-600">
                  Special configuration for Floor {template.special_config.floor}
                  {template.special_config.location && ` (${template.special_config.location})`}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {(!templates || templates.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No lighting templates available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};