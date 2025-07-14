import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, BarChart3 } from "lucide-react";
import { useMonitoring, MonitoredItem } from "@/hooks/useMonitoring";
import { formatDistanceToNow } from "date-fns";

export const MonitoringDashboard = () => {
  const [monitoredItems, setMonitoredItems] = useState<MonitoredItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getMonitoredItems, removeFromMonitoring } = useMonitoring();

  useEffect(() => {
    const fetchMonitoredItems = async () => {
      setIsLoading(true);
      const items = await getMonitoredItems();
      setMonitoredItems(items);
      setIsLoading(false);
    };

    fetchMonitoredItems();
  }, [getMonitoredItems]);

  const handleRemoveItem = async (itemType: string, itemId: string) => {
    const success = await removeFromMonitoring(itemType, itemId);
    if (success) {
      setMonitoredItems(items => 
        items.filter(item => !(item.item_type === itemType && item.item_id === itemId))
      );
    }
  };

  const getItemTypeColor = (itemType: string) => {
    const colors = {
      issue: "bg-destructive/10 text-destructive border-destructive/20",
      room: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      occupant: "bg-green-500/10 text-green-600 border-green-500/20",
      key: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    };
    return colors[itemType as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Monitored Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading monitored items...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (monitoredItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Monitored Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No items are currently being monitored.</p>
            <p className="text-sm">Use the "Monitor" button on issues, rooms, or other items to start tracking them.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Monitored Items ({monitoredItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {monitoredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getItemTypeColor(item.item_type)}>
                    {item.item_type}
                  </Badge>
                  <h4 className="font-medium">{item.item_name}</h4>
                </div>
                {item.item_description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.item_description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Added {formatDistanceToNow(new Date(item.created_at))} ago
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveItem(item.item_type, item.item_id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};