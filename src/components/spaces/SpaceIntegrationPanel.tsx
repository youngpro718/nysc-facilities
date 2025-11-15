// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Package, Users, Key, MapPin, AlertTriangle } from "lucide-react";

interface SpaceIntegrationPanelProps {
  spaceId: string;
  spaceType: "room" | "hallway" | "door";
  spaceName: string;
}

export const SpaceIntegrationPanel = ({ spaceId, spaceType, spaceName }: SpaceIntegrationPanelProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch space-related inventory (only for rooms)
  const { data: inventory } = useQuery({
    queryKey: ['space-inventory', spaceId],
    queryFn: async () => {
      if (spaceType !== 'room') return [];
      
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, description, quantity, unit, status')
        .eq('storage_room_id', spaceId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: spaceType === 'room'
  });

  // Fetch space assignments (only for rooms)
  const { data: assignments } = useQuery({
    queryKey: ['space-assignments', spaceId],
    queryFn: async () => {
      if (spaceType !== 'room') return [];
      
      const { data, error } = await supabase
        .rpc('get_room_assignments_with_details', { p_room_id: spaceId });
      
      if (error) throw error;
      return data || [];
    },
    enabled: spaceType === 'room'
  });

  // Fetch related keys
  const { data: keys } = useQuery({
    queryKey: ['space-keys', spaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keys')
        .select('id, name, type, is_passkey, location_data, available_quantity, total_quantity')
        .contains('location_data', { room_id: spaceId });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Simple door issues query for doors
  const { data: doorIssues } = useQuery({
    queryKey: ['door-issues', spaceId],
    queryFn: async () => {
      if (spaceType !== 'door') return [];
      
      const { data, error } = await supabase
        .from('issues')
        .select('id, issue_type, status, created_at')
        .eq('space_id', spaceId)
        .eq('space_type', 'door')
        .neq('status', 'resolved');
      
      if (error) throw error;
      return data || [];
    },
    enabled: spaceType === 'door'
  });

  const getInventoryStats = () => {
    if (!inventory) return { total: 0, categories: 0, lowStock: 0 };
    
    const categories = new Set(inventory.map(item => item.unit || 'unknown')).size;
    const lowStock = inventory.filter(item => item.quantity < 5).length;
    
    return {
      total: inventory.length,
      categories,
      lowStock
    };
  };

  const stats = getInventoryStats();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {spaceName} Integration Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Inventory Items</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Assignments</p>
                      <p className="text-2xl font-bold">{assignments?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Keys</p>
                      <p className="text-2xl font-bold">{keys?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Open Issues</p>
                      <p className="text-2xl font-bold">{doorIssues?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4 mt-4">
            {spaceType === 'room' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Room Inventory</h3>
                  <Button size="sm">Manage Inventory</Button>
                </div>
                
                {stats.lowStock > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">{stats.lowStock} items are running low on stock</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-2">
                  {inventory?.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.unit || 'No unit'}</p>
                      </div>
                      <Badge variant={item.quantity < 5 ? "destructive" : "secondary"}>
                        Qty: {item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                {(inventory?.length || 0) > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    And {inventory!.length - 5} more items...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Inventory tracking is only available for rooms
              </div>
            )}
          </TabsContent>

          <TabsContent value="access" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Access Management</h3>
                <Button size="sm">Manage Access</Button>
              </div>

              {assignments && assignments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Current Assignments</h4>
                  <div className="grid gap-2">
                    {assignments.slice(0, 3).map((assignment: any) => (
                      <div key={assignment.assignment_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{assignment.occupant_name}</p>
                          <p className="text-sm text-muted-foreground">{assignment.assignment_type}</p>
                        </div>
                        <Badge variant={assignment.is_primary ? "default" : "secondary"}>
                          {assignment.is_primary ? "Primary" : "Secondary"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {keys && keys.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Associated Keys</h4>
                  <div className="grid gap-2">
                    {keys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <p className="text-sm text-muted-foreground">{key.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {key.is_passkey && <Badge variant="outline">Passkey</Badge>}
                          <Badge variant="secondary">
                            {key.available_quantity}/{key.total_quantity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Open Issues</h3>
                <Button size="sm">Report Issue</Button>
              </div>

              {doorIssues && doorIssues.length > 0 ? (
                <div className="grid gap-2">
                  {doorIssues.map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{issue.issue_type}</p>
                        <p className="text-sm text-muted-foreground">
                          Reported {new Date(issue.reported_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="default">
                        {issue.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No open issues for this space
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};