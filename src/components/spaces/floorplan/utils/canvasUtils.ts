import { Canvas, Line as FabricLine, Group as FabricGroup, Text as FabricText, Rect as FabricRect } from "fabric";
import { FloorPlanObject, ROOM_COLORS } from "../types/floorPlanTypes";

export function createGrid(canvas: Canvas, gridSize: number) {
  console.log('Creating grid with size:', gridSize);
  
  // Get canvas dimensions
  const canvasWidth = canvas.width ?? 800;
  const canvasHeight = canvas.height ?? 600;
  
  // Calculate the number of lines needed
  const numHorizontalLines = Math.ceil(canvasHeight / gridSize);
  const numVerticalLines = Math.ceil(canvasWidth / gridSize);

  // Create grid lines
  const lines: FabricLine[] = [];

  // Create vertical lines
  for (let i = 0; i <= numVerticalLines; i++) {
    const x = (i * gridSize) - (canvasWidth / 2);
    const line = new FabricLine(
      [x, -canvasHeight/2, x, canvasHeight/2],
      {
        stroke: '#e5e7eb',
        selectable: false,
        strokeWidth: 1,
        evented: false
      }
    );
    lines.push(line);
  }
  
  // Create horizontal lines
  for (let i = 0; i <= numHorizontalLines; i++) {
    const y = (i * gridSize) - (canvasHeight / 2);
    const line = new FabricLine(
      [-canvasWidth/2, y, canvasWidth/2, y],
      {
        stroke: '#e5e7eb',
        selectable: false,
        strokeWidth: 1,
        evented: false
      }
    );
    lines.push(line);
  }

  // Create and configure grid group
  const gridGroup = new FabricGroup(lines, {
    selectable: false,
    evented: false,
    left: canvasWidth / 2,
    top: canvasHeight / 2,
    originX: 'center',
    originY: 'center'
  });

  // Add the grid to canvas
  canvas.add(gridGroup);
  canvas.renderAll();
  
  console.log('Grid created with dimensions:', canvasWidth, 'x', canvasHeight);
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

export function createDoor(x: number, y: number) {
  const doorWidth = 40;
  const doorHeight = 10;
  
  const door = new FabricRect({
    left: x - doorWidth / 2,
    top: y - doorHeight / 2,
    width: doorWidth,
    height: doorHeight,
    fill: '#94a3b8',
    stroke: '#475569',
    strokeWidth: 2,
    selectable: true,
    hasControls: true
  });

  const text = new FabricText('Door', {
    left: x,
    top: y + doorHeight,
    fontSize: 12,
    fill: '#475569',
    originX: 'center',
    originY: 'top',
    selectable: false
  });

  const group = new FabricGroup([door, text], {
    left: x,
    top: y,
    selectable: true,
    hasControls: true
  });

  return group;
}
