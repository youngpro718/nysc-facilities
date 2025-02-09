
import { Canvas, Line as FabricLine, Group as FabricGroup, Text as FabricText, Rect as FabricRect } from "fabric";
import { FloorPlanObject, ROOM_COLORS } from "../types/floorPlanTypes";

export function createGrid(canvas: Canvas, gridSize: number) {
  console.log('Creating grid with size:', gridSize);
  const gridGroup = new FabricGroup([], {
    selectable: false,
    evented: false
  });

  for (let i = 0; i < canvas.getWidth(); i += gridSize) {
    const line = new FabricLine([i, 0, i, canvas.getHeight()], {
      stroke: '#e5e7eb',
      selectable: false
    });
    gridGroup.add(line);
  }
  
  for (let i = 0; i < canvas.getHeight(); i += gridSize) {
    const line = new FabricLine([0, i, canvas.getWidth(), i], {
      stroke: '#e5e7eb',
      selectable: false
    });
    gridGroup.add(line);
  }

  canvas.add(gridGroup);
  console.log('Grid created with dimensions:', canvas.getWidth(), 'x', canvas.getHeight());
  return gridGroup;
}

export function createRoomGroup(obj: FloorPlanObject) {
  console.log('Creating room group for:', obj);
  
  if (!obj.rooms) {
    console.warn('No room data found for object:', obj);
    return null;
  }

  const room = new FabricRect({
    width: obj.width,
    height: obj.height,
    fill: ROOM_COLORS[obj.rooms.room_type] || ROOM_COLORS.default,
    stroke: '#94a3b8',
    strokeWidth: 2,
    selectable: true,
    hasControls: true
  });
  console.log('Created room rectangle:', room);

  const text = new FabricText(`${obj.rooms.name}\n${obj.rooms.room_number}`, {
    left: obj.width / 2,
    top: obj.height / 2,
    fontSize: 14,
    fill: '#475569',
    originX: 'center',
    originY: 'center',
    textAlign: 'center'
  });
  console.log('Created room text:', text);

  const group = new FabricGroup([room, text], {
    left: obj.position_x,
    top: obj.position_y,
    selectable: true,
    hasControls: true
  });

  (group as any).customData = { id: obj.id, roomData: obj.rooms };
  console.log('Created final room group at position:', obj.position_x, obj.position_y);

  return group;
}
