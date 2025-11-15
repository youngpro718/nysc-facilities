import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { StatusEnum } from "../../rooms/types/roomEnums";
import { LightingStatusWheel } from "@/components/spaces/LightingStatusWheel";

interface SpaceCardProps<T> {
  item: T;
  onDelete: (id: string) => void;
  renderContent?: (item: T) => React.ReactNode;
  type: "room" | "hallway" | "door";
  lighting?: { functional: number; total: number; onClick?: () => void };
  onAssignRoom?: (id: string) => void;
}

export function SpaceCard<T extends { id: string; name: string; status: string; floor_id: string }>({ 
  item,
  onDelete,
  renderContent,
  type,
  lighting,
  onAssignRoom,
}: SpaceCardProps<T>) {
  const navigate = useNavigate();
  const initialData = {
    id: item.id,
    name: item.name,
    status: item.status as StatusEnum,
    floorId: item.floor_id,
  };

  // Auto-detect lighting metrics from common shapes if not provided via props
  const detectedFunctional = ((): number | undefined => {
    const anyItem: any = item as any;
    return (
      anyItem?.functional_lights ??
      anyItem?.lights?.functional ??
      anyItem?.properties?.functional_lights ??
      undefined
    );
  })();
  const detectedTotal = ((): number | undefined => {
    const anyItem: any = item as any;
    return (
      anyItem?.total_lights ??
      anyItem?.lights?.total ??
      anyItem?.properties?.total_lights ??
      undefined
    );
  })();
  const effectiveLighting = lighting ?? (
    typeof detectedFunctional === 'number' && typeof detectedTotal === 'number'
      ? { functional: detectedFunctional, total: detectedTotal }
      : undefined
  );

  // Fallback: if no explicit lighting, try deriving from fixture_count and open_issue_count
  const derivedLighting = React.useMemo(() => {
    if (effectiveLighting) return effectiveLighting;
    const anyItem: any = item as any;
    const total = anyItem?.fixture_count;
    const openIssues = anyItem?.open_issue_count;
    if (typeof total === 'number' && total > 0) {
      const functional = typeof openIssues === 'number' ? Math.max(0, total - openIssues) : undefined;
      if (typeof functional === 'number') {
        return { functional, total } as { functional: number; total: number };
      }
    }
    return undefined;
  }, [effectiveLighting, item]);

  return (
    <Card id={`space-card-${item.id}`} data-space-id={item.id}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="truncate">{item.name}</span>
          <div className="flex items-center gap-2">
            {(effectiveLighting || derivedLighting) && (
              <LightingStatusWheel
                functional={(effectiveLighting ?? derivedLighting)!.functional}
                total={(effectiveLighting ?? derivedLighting)!.total}
                onClick={
                  (lighting?.onClick) ?? (() => {
                    navigate(`/lighting?room=${encodeURIComponent(item.name)}`);
                  })
                }
                title={`${(effectiveLighting ?? derivedLighting)!.functional}/${(effectiveLighting ?? derivedLighting)!.total} lights functional`}
              />
            )}
            <Badge variant={item.status === StatusEnum.ACTIVE ? 'default' : 'destructive'}>
              {item.status}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {renderContent?.(item)}
          <div className="flex flex-wrap gap-2 mt-4">
            {type === "room" && (
              <EditSpaceDialog
                id={item.id}
                type="room"
                initialData={initialData}
              />
            )}
            {(effectiveLighting || derivedLighting) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(lighting?.onClick) ?? (() => navigate(`/lighting?room=${encodeURIComponent(item.name)}`))}
              >
                Lighting
              </Button>
            )}
            {onAssignRoom && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignRoom(item.id)}
              >
                Assign Room
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
