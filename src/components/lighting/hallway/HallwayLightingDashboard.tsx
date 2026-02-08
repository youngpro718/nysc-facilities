import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  TrendingUp
} from 'lucide-react';
import { LightingTemplateManager } from '../templates/LightingTemplateManager';

interface HallwayLightingStats {
  hallway_id: string;
  hallway_name: string;
  section: string;
  total_fixtures: number;
  functional_fixtures: number;
  non_functional_fixtures: number;
  maintenance_needed: number;
  total_bulbs: number;
  functional_bulbs: number;
}

interface HallwayLightingDashboardProps {
  floorId: string;
  floorNumber: number;
  stats?: HallwayLightingStats[];
}

export const HallwayLightingDashboard: React.FC<HallwayLightingDashboardProps> = ({
  floorId,
  floorNumber,
  stats = [],
}) => {
  const getSectionBadgeColor = (section: string) => {
    switch (section) {
      case 'main': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800';
      case 'north_east':
      case 'north_west': return 'bg-green-100 dark:bg-green-900/30 text-green-800';
      case 'center_east':
      case 'center_west': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800';
      case 'south_east':
      case 'south_west': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800';
      default: return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800';
    }
  };

  const getHealthStatus = (functional: number, total: number) => {
    if (total === 0) return { status: 'unknown', color: 'text-gray-500' };
    const percentage = (functional / total) * 100;
    if (percentage >= 95) return { status: 'excellent', color: 'text-green-600 dark:text-green-400' };
    if (percentage >= 80) return { status: 'good', color: 'text-blue-600 dark:text-blue-400' };
    if (percentage >= 60) return { status: 'fair', color: 'text-yellow-600 dark:text-yellow-400' };
    return { status: 'poor', color: 'text-red-600 dark:text-red-400' };
  };

  const overallStats = stats.reduce(
    (acc, hallway) => ({
      total_fixtures: acc.total_fixtures + hallway.total_fixtures,
      functional_fixtures: acc.functional_fixtures + hallway.functional_fixtures,
      total_bulbs: acc.total_bulbs + hallway.total_bulbs,
      functional_bulbs: acc.functional_bulbs + hallway.functional_bulbs,
      maintenance_needed: acc.maintenance_needed + hallway.maintenance_needed,
    }),
    { total_fixtures: 0, functional_fixtures: 0, total_bulbs: 0, functional_bulbs: 0, maintenance_needed: 0 }
  );

  const overallHealth = getHealthStatus(overallStats.functional_fixtures, overallStats.total_fixtures);

  return (
    <div className="space-y-6">
      {/* Floor Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Floor {floorNumber} Lighting Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{overallStats.total_fixtures}</div>
              <div className="text-sm text-gray-600">Total Fixtures</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${overallHealth.color}`}>
                {overallStats.functional_fixtures}
              </div>
              <div className="text-sm text-gray-600">Functional</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{overallStats.total_bulbs}</div>
              <div className="text-sm text-gray-600">Total Bulbs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {overallStats.maintenance_needed}
              </div>
              <div className="text-sm text-gray-600">Need Maintenance</div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Overall Health:</span>
            <Badge className={overallHealth.color.replace('text-', 'bg-').replace('-600', '-100')}>
              {overallHealth.status.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Hallway Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Hallway Sections</h3>
          {stats.map((hallway) => {
            const health = getHealthStatus(hallway.functional_fixtures, hallway.total_fixtures);
            return (
              <Card key={hallway.hallway_id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{hallway.hallway_name}</h4>
                      <Badge className={getSectionBadgeColor(hallway.section)}>
                        {hallway.section.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{hallway.total_fixtures}</div>
                      <div className="text-gray-600">Fixtures</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-semibold ${health.color}`}>
                        {hallway.functional_fixtures}
                      </div>
                      <div className="text-gray-600">Working</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{hallway.total_bulbs}</div>
                      <div className="text-gray-600">Bulbs</div>
                    </div>
                  </div>
                  
                  {hallway.maintenance_needed > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">
                        {hallway.maintenance_needed} fixtures need maintenance
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          
          {stats.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hallway data available for this floor</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Template Manager */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Lighting Templates</h3>
          <LightingTemplateManager floorNumber={floorNumber} />
        </div>
      </div>

      {/* Special Configurations for 13th and 16th Floors */}
      {(floorNumber === 13 || floorNumber === 16) && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <TrendingUp className="h-5 w-5" />
              Special Floor Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-amber-700">
              <p className="mb-2">
                Floor {floorNumber} has special lighting configurations for the north end of the building.
              </p>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">
                  Additional fixtures required for north-end lighting
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};