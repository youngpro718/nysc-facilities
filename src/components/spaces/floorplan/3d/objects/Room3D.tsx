
import * as THREE from 'three';
import { FloorPlanNode } from '../../types/floorPlanTypes';

export function createRoom3D(node: FloorPlanNode, isSelected: boolean = false): THREE.Object3D {
  const { width, height } = node.data.size;
  const depth = 40; // Standard room height
  
  // Create room geometry (slightly elevated from ground)
  const geometry = new THREE.BoxGeometry(width, depth, height);
  
  // Get the color from node data or use default
  const color = node.data.style?.backgroundColor || '#e2e8f0';
  
  // Create materials with different properties for sides and top/bottom
  const materials = [
    new THREE.MeshStandardMaterial({ 
      color: color, 
      metalness: 0.1,
      roughness: 0.7,
      side: THREE.DoubleSide 
    }), // right side
    new THREE.MeshStandardMaterial({ 
      color: color, 
      metalness: 0.1,
      roughness: 0.7,
      side: THREE.DoubleSide 
    }), // left side
    new THREE.MeshStandardMaterial({ 
      color: color, 
      metalness: 0.1,
      roughness: 0.7,
      opacity: 0.95, 
      transparent: true,
      side: THREE.DoubleSide 
    }), // top - slightly transparent
    new THREE.MeshStandardMaterial({ 
      color: color, 
      metalness: 0.1,
      roughness: 0.9,
      side: THREE.DoubleSide 
    }), // bottom
    new THREE.MeshStandardMaterial({ 
      color: color, 
      metalness: 0.1,
      roughness: 0.7,
      side: THREE.DoubleSide 
    }), // front
    new THREE.MeshStandardMaterial({ 
      color: color, 
      metalness: 0.1,
      roughness: 0.7,
      side: THREE.DoubleSide 
    })  // back
  ];
  
  // If selected, adjust materials
  if (isSelected) {
    materials.forEach(material => {
      material.emissive = new THREE.Color(0x333333);
      material.color = new THREE.Color(0xaaccff);
    });
  }

  const mesh = new THREE.Mesh(geometry, materials);
  
  // Position in 3D space - center the box on its bottom face
  mesh.position.set(node.position.x, depth / 2, node.position.y);
  
  // Apply rotation if available
  if (node.rotation) {
    mesh.rotation.y = (node.rotation * Math.PI) / 180;
  }
  
  // Enable shadows
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  // Add the room label
  const roomLabel = createRoomLabel(node);
  roomLabel.position.set(0, depth + 5, 0); // Position the label on top of the room
  mesh.add(roomLabel);
  
  // Add userData for raycasting
  mesh.userData = { nodeId: node.id };
  
  return mesh;
}

function createRoomLabel(node: FloorPlanNode): THREE.Object3D {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Object3D(); // fallback
  
  canvas.width = 256;
  canvas.height = 128;
  
  // Set background color
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Set text properties
  context.fillStyle = '#000000';
  context.font = 'Bold 24px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Write the room name (wrapped if needed)
  const roomName = node.data.label || '';
  const roomNumber = node.data.properties?.room_number || '';
  
  // Limit text length to prevent overflow
  const maxLength = 20;
  const displayName = roomName.length > maxLength ? 
    roomName.substring(0, maxLength) + '...' : roomName;
  
  context.fillText(displayName, canvas.width / 2, canvas.height / 2 - 15);
  
  if (roomNumber) {
    context.font = '18px Arial';
    context.fillText(`#${roomNumber}`, canvas.width / 2, canvas.height / 2 + 15);
  }
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  // Create sprite material using the texture
  const material = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true
  });
  
  // Create the sprite and scale it
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(60, 30, 1);
  
  return sprite;
}
