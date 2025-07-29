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
  const { hallwayWidth, roomSpacing, hallwayLength, startPosition } = options;
  
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
  const effectiveSpacing = Math.min(roomSpacing, hallwayLength / roomsPerSide);
  
  rooms.forEach((room, index) => {
    const isLeftSide = index % 2 === 0;
    const positionIndex = Math.floor(index / 2);
    
    // Calculate position along the hallway
    const xPosition = startPosition.x - hallwayLength/2 + (positionIndex * effectiveSpacing) + effectiveSpacing/2;
    
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
      const currentHallway = allHallways[i];
      const nextHallway = allHallways[i + 1];
      
      // Connect the end of current hallway to the start of next hallway
      allConnections.push({
        id: `hallway-connector-${i}`,
        from: { 
          x: currentHallway.position.x + currentHallway.size.width/2, 
          y: currentHallway.position.y 
        },
        to: { 
          x: nextHallway.position.x - nextHallway.size.width/2, 
          y: nextHallway.position.y 
        }
      });
    }
  }
  
  return {
    rooms: allRooms,
    hallways: allHallways,
    connections: allConnections
  };
}
