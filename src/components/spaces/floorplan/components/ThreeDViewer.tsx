
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThreeDScene from "../three-d/ThreeDScene";

interface ThreeDViewerProps {
  floorId: string | null;
  isVisible?: boolean;
}

export function ThreeDViewer({ floorId, isVisible = false }: ThreeDViewerProps) {
  const [activeTab, setActiveTab] = useState<string>("3d");

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="w-full col-span-full border shadow rounded-lg">
      <CardHeader className="px-6 py-4 border-b bg-muted/20">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">3D Floor Plan Viewer</CardTitle>
          <Tabs defaultValue="3d" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="3d">3D View</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="3d" value={activeTab} className="w-full">
          <TabsContent value="3d" className="mt-0">
            <div className="h-[600px] w-full">
              {floorId && <ThreeDScene floorId={floorId} />}
            </div>
          </TabsContent>
          <TabsContent value="settings" className="mt-0 p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">View Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Settings controls would go here */}
                <p className="text-muted-foreground col-span-full">
                  3D view settings are not yet implemented.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
