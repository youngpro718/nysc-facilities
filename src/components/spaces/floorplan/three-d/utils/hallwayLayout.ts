import { RoomData, ConnectionData } from '../core/Scene3DManager';

export interface HallwayLayoutOptions {
  hallwayWidth: number;
  roomSpacing: number;
  hallwayLength: number;
  startPosition: { x: number; y: number };
}

export interface LayoutResult {
  rooms: RoomData[];
  hallways: RoomData[];
  connections: ConnectionData[];
}

export function createHallwayLayout(
  rooms: RoomData[], 
  options: HallwayLayoutOptions = {
    hallwayWidth: 80,
    roomSpacing: 200,
    hallwayLength: 1000,
    startPosition: { x: 0, y: 0 }
  }
): LayoutResult {
  // Input validation: guard against invalid/empty inputs
  if (!rooms || rooms.length === 0) {
    return { rooms: [], hallways: [], connections: [] };
  }

  const { hallwayWidth, roomSpacing, hallwayLength, startPosition } = options;
  if (!(hallwayWidth > 0)) {
    throw new Error("createHallwayLayout: 'hallwayWidth' must be a positive number");
  }
  if (!(hallwayLength > 0)) {
    throw new Error("createHallwayLayout: 'hallwayLength' must be a positive number");
  }
  if (!(roomSpacing >= 0)) {
    throw new Error("createHallwayLayout: 'roomSpacing' must be a non-negative number");
  }
  
  // Create main hallway
  const mainHallway: RoomData = {
    id: 'main-hallway',
    name: 'Main Hallway',
    position: { 
      x: startPosition.x, 
      y: startPosition.y 
    },
    size: { 
      width: hallwayLength, 
      height: hallwayWidth 
    },
    type: 'hallway',
    rotation: 0
  };

  // Arrange rooms along both sides of the hallway
  const layoutRooms: RoomData[] = [];
  const connections: ConnectionData[] = [];
  
  const roomsPerSide = Math.ceil(rooms.length / 2);
  // Account for total widths of rooms on each side to prevent overlaps
  const leftRooms = rooms.filter((_, idx) => idx % 2 === 0);
  const rightRooms = rooms.filter((_, idx) => idx % 2 === 1);
  const totalWidthLeft = leftRooms.reduce((sum, r) => sum + (r.size?.width || 0), 0);
  const totalWidthRight = rightRooms.reduce((sum, r) => sum + (r.size?.width || 0), 0);
  const availableLengthLeft = Math.max(0, hallwayLength - totalWidthLeft);
  const availableLengthRight = Math.max(0, hallwayLength - totalWidthRight);
  const spacingLeft = roomsPerSide > 0 ? availableLengthLeft / roomsPerSide : 0;
  const spacingRight = roomsPerSide > 0 ? availableLengthRight / roomsPerSide : 0;
  const effectiveSpacing = Math.max(0, Math.min(roomSpacing, spacingLeft, spacingRight));
  
  rooms.forEach((room, index) => {
    const isLeftSide = index % 2 === 0;
    const positionIndex = Math.floor(index / 2);
    
    // Calculate nominal center position along the hallway
    const nominalCenter = startPosition.x - hallwayLength / 2 + (positionIndex * effectiveSpacing) + effectiveSpacing / 2;
    // Clamp center so the room stays fully within hallway horizontal bounds
    const halfWidth = Math.max(0, (room.size?.width || 0) / 2);
    const hallMinX = startPosition.x - hallwayLength / 2 + halfWidth;
    const hallMaxX = startPosition.x + hallwayLength / 2 - halfWidth;
    const xPosition = Math.min(hallMaxX, Math.max(hallMinX, nominalCenter));
    
    // Position rooms on either side of the hallway
    const yOffset = hallwayWidth/2 + room.size.height/2 + 20; // 20px gap from hallway
    const yPosition = isLeftSide 
      ? startPosition.y - yOffset 
      : startPosition.y + yOffset;

    const layoutRoom: RoomData = {
      ...room,
      position: { x: xPosition, y: yPosition }
    };

    layoutRooms.push(layoutRoom);

    // Create connection from room to hallway
    const connectionId = `conn-${room.id}-hallway`;
    const roomCenter = { x: xPosition, y: yPosition };
    const hallwayEdge = { 
      x: xPosition, 
      y: isLeftSide ? startPosition.y - hallwayWidth/2 : startPosition.y + hallwayWidth/2 
    };

    connections.push({
      id: connectionId,
      from: roomCenter,
      to: hallwayEdge
    });
  });

  return {
    rooms: layoutRooms,
    hallways: [mainHallway],
    connections
  };
}

export function createMultiHallwayLayout(
  rooms: RoomData[],
  hallwayCount: number = 2,
  options: Partial<HallwayLayoutOptions> = {}
): LayoutResult {
  if (!(hallwayCount > 0)) {
    throw new Error("createMultiHallwayLayout: 'hallwayCount' must be a positive integer");
  }
  const defaultOptions: HallwayLayoutOptions = {
    hallwayWidth: 80,
    roomSpacing: 180,
    hallwayLength: 800,
    startPosition: { x: 0, y: 0 }
  };
  
  const layoutOptions = { ...defaultOptions, ...options };
  const roomsPerHallway = Math.ceil(rooms.length / hallwayCount);
  
  let allRooms: RoomData[] = [];
  let allHallways: RoomData[] = [];
  let allConnections: ConnectionData[] = [];
  
  for (let i = 0; i < hallwayCount; i++) {
    const startIndex = i * roomsPerHallway;
    const endIndex = Math.min(startIndex + roomsPerHallway, rooms.length);
    const hallwayRooms = rooms.slice(startIndex, endIndex);
    
    if (hallwayRooms.length === 0) continue;
    
    const hallwayStartY = layoutOptions.startPosition.y + (i * 300); // 300px between hallways
    const hallwayOptions = {
      ...layoutOptions,
      startPosition: { x: layoutOptions.startPosition.x, y: hallwayStartY }
    };
    
    const hallwayLayout = createHallwayLayout(hallwayRooms, hallwayOptions);
    
    // Update hallway name
    hallwayLayout.hallways[0].name = `Hallway ${i + 1}`;
    hallwayLayout.hallways[0].id = `hallway-${i + 1}`;
    
    allRooms.push(...hallwayLayout.rooms);
    allHallways.push(...hallwayLayout.hallways);
    allConnections.push(...hallwayLayout.connections);
  }
  
  // Create connections between hallways if there are multiple
  if (hallwayCount > 1) {
    for (let i = 0; i < allHallways.length - 1; i++) {
      const cur = allHallways[i];
      const nxt = allHallways[i + 1];

      // Right edge (current) and left edge (next)
      const curRightX = cur.position.x + cur.size.width / 2;
      const nxtLeftX = nxt.position.x - nxt.size.width / 2;

      // Vertical ranges
      const curMinY = cur.position.y - cur.size.height / 2;
      const curMaxY = cur.position.y + cur.size.height / 2;
      const nxtMinY = nxt.position.y - nxt.size.height / 2;
      const nxtMaxY = nxt.position.y + nxt.size.height / 2;

      // Compute closest vertical alignment between edges
      const overlapMin = Math.max(curMinY, nxtMinY);
      const overlapMax = Math.min(curMaxY, nxtMaxY);

      let yFrom: number;
      let yTo: number;
      if (overlapMin <= overlapMax) {
        // There is vertical overlap: connect through the midpoint of the overlap
        const yMid = (overlapMin + overlapMax) / 2;
        yFrom = yMid;
        yTo = yMid;
      } else {
        // No overlap: connect the closest endpoints
        // Choose the pair of edge points with minimum vertical distance
        const candidates: Array<{ y1: number; y2: number; d: number }> = [
          { y1: curMinY, y2: nxtMaxY, d: Math.abs(curMinY - nxtMaxY) },
          { y1: curMaxY, y2: nxtMinY, d: Math.abs(curMaxY - nxtMinY) },
          { y1: curMinY, y2: nxtMinY, d: Math.abs(curMinY - nxtMinY) },
          { y1: curMaxY, y2: nxtMaxY, d: Math.abs(curMaxY - nxtMaxY) },
        ];
        candidates.sort((a, b) => a.d - b.d);
        yFrom = candidates[0].y1;
        yTo = candidates[0].y2;
      }

      allConnections.push({
        id: `hallway-connector-${i}`,
        from: { x: curRightX, y: yFrom },
        to: { x: nxtLeftX, y: yTo },
      });
    }
  }
  
  return {
    rooms: allRooms,
    hallways: allHallways,
    connections: allConnections
  };
}
