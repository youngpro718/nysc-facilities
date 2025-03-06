
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ConnectionItemProps } from "./types";

export function ConnectionItem({ connection, index, spaceName, onRemove }: ConnectionItemProps) {
  return (
    <Card key={index} className="overflow-hidden">
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {connection.connectionType || "Unknown"}
          </Badge>
          <span className="text-sm">{spaceName}</span>
          {connection.direction && (
            <Badge variant="secondary" className="text-xs">
              {connection.direction}
            </Badge>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRemove(index)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
