
import * as THREE from 'three';
import { FloorPlanNode, ROOM_COLORS } from '../../types/floorPlanTypes';

export function createRoom3D(node: FloorPlanNode, isSelected: boolean = false): THREE.Object3D {
  // Get room properties
  const { width, height } = node.data.size;
  const depth = 30; // Default room height
  const roomType = node.data.type || 'default';
  const isStorage = node.data.properties?.isStorage || false;
  const isPrivate = node.data.properties?.roomType === 'private' || 
                   node.data.properties?.roomType === 'office' || 
                   roomType === 'private';
  
  // Determine color and appearance based on room type
  const colorKey = Object.keys(ROOM_COLORS).includes(roomType) ? roomType : 'default';
  let color = ROOM_COLORS[colorKey];
  
  if (isStorage) {
    // Darken the color slightly for storage rooms
    const c = new THREE.Color(color);
    c.offsetHSL(0, 0, -0.1);
    color = c.getStyle();
  }
  
  // Create basic room geometry
  const geometry = new THREE.BoxGeometry(width, depth, height);
  
  // Create materials with different appearance based on room type
  const materials = [
    new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.2 }), // Right side
    new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.2 }), // Left side
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.1 }), // Top
    new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9, metalness: 0.1 }), // Bottom
    new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.2 }), // Front
    new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.2 })  // Back
  ];
  
  // Create mesh
  const room = new THREE.Mesh(geometry, materials);
  room.castShadow = true;
  room.receiveShadow = true;
  
  // Position the room
  room.position.set(node.position.x, depth / 2, node.position.y);
  
  // Rotate if needed
  if (node.rotation) {
    room.rotation.y = -node.rotation * (Math.PI / 180);
  }
  
  // Parent/Child room relationship
  if (node.data.properties?.parent_room_id) {
    // Add a slight elevation for child rooms
    room.position.y += 5;
  }
  
  // Add highlights for selected room
  if (isSelected) {
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edgeGeometry, lineMaterial);
    room.add(wireframe);
    
    // Add a subtle glow effect for selected room
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(width + 2, depth + 2, height + 2),
      glowMaterial
    );
    room.add(glowMesh);
  }
  
  // Add label for room name
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;
  
  if (context) {
    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'Bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#333333';
    context.fillText(node.data.label || '', canvas.width / 2, canvas.height / 2);
    
    // Add room number if available
    if (node.data.properties?.roomNumber) {
      context.font = '20px Arial';
      context.fillText(`Room ${node.data.properties.roomNumber}`, canvas.width / 2, 80);
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  
  const labelGeometry = new THREE.PlaneGeometry(80, 40);
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.set(0, depth + 10, 0);
  label.rotation.x = -Math.PI / 2;
  room.add(label);
  
  // Set userData for raycasting
  room.userData = { nodeId: node.id };
  
  return room;
}
