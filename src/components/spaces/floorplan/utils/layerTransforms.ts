
import { FloorPlanLayer, FloorPlanLayerDB } from '../types/floorPlanTypes';

export function transformLayer(layer: FloorPlanLayerDB): FloorPlanLayer {
  return {
    id: layer.id,
    name: layer.name,
    floorId: layer.floor_id,
    type: layer.type,
    visible: layer.visible,
    orderIndex: layer.order_index,
    data: layer.data
  };
}
