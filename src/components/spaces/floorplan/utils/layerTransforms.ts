
import { FloorPlanLayer, FloorPlanLayerDB } from "../types/floorPlanTypes";

export function transformLayer(raw: FloorPlanLayerDB): FloorPlanLayer {
  const parsedData = typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data;
  
  return {
    id: raw.id,
    floorId: raw.floor_id,
    type: raw.type,
    name: raw.name,
    orderIndex: raw.order_index,
    visible: raw.visible,
    data: parsedData || {}
  };
}
