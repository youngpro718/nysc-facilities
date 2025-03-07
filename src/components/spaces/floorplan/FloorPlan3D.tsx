
import React, { useState } from 'react';
import { useFloorPlanData } from './hooks/useFloorPlanData';
import { Scene3D } from './3d/Scene3D';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface FloorPlan3DProps {
  floorId: string | null;
}

export function FloorPlan3D({ floorId }: FloorPlan3DProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const { objects, edges, isLoading, error } = useFloorPlanData(floorId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Floor Plan - 3D View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[600px] flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Floor Plan - 3D View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px] flex items-center justify-center">
            <div className="text-destructive">
              Error loading floor plan data: {error.message}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Floor Plan - 3D View</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[600px] border rounded-md overflow-hidden">
          <Scene3D 
            nodes={objects} 
            edges={edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>
      </CardContent>
    </Card>
  );
}
