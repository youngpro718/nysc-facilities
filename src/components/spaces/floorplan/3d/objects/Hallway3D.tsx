
import * as THREE from 'three';
import { FloorPlanNode } from '../../types/floorPlanTypes';

export function createHallway3D(node: FloorPlanNode, isSelected: boolean = false): THREE.Object3D {
  const { width, height } = node.data.size;
  const depth = 20; // Lower height than rooms
  
  // Create hallway geometry (flat on ground)
  const geometry = new THREE.BoxGeometry(width, depth, height);
  
  // Get color from node data or use default
  const color = node.data.style?.backgroundColor || '#e0e0e0';
  
  // Create material
  const material = new THREE.MeshStandardMaterial({ 
    color: color,
    roughness: 0.6,
    metalness: 0.2,
    side: THREE.DoubleSide
  });
  
  // If selected, adjust material
  if (isSelected) {
    material.emissive = new THREE.Color(0x222222);
    material.color = new THREE.Color(0xaaddff);
  }
  
  const mesh = new THREE.Mesh(geometry, material);
  
  // Position in 3D space - almost flat with the ground
  mesh.position.set(node.position.x, depth / 2, node.position.y);
  
  // Apply rotation if available
  if (node.rotation) {
    mesh.rotation.y = (node.rotation * Math.PI) / 180;
  }
  
  // Add shadows
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  // Add the hallway label
  const hallwayLabel = createHallwayLabel(node);
  hallwayLabel.position.set(0, depth + 2, 0); // Position label just above hallway
  mesh.add(hallwayLabel);
  
  // Add userData for raycasting
  mesh.userData = { nodeId: node.id };
  
  return mesh;
}

function createHallwayLabel(node: FloorPlanNode): THREE.Object3D {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Object3D(); // fallback
  
  canvas.width = 256;
  canvas.height = 64;
  
  // Set background with transparency
  context.fillStyle = 'rgba(255, 255, 255, 0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Set text properties
  context.fillStyle = '#333333';
  context.font = '18px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Write the hallway name
  const hallwayName = node.data.label || 'Hallway';
  
  // Limit text length to prevent overflow
  const maxLength = 25;
  const displayName = hallwayName.length > maxLength ? 
    hallwayName.substring(0, maxLength) + '...' : hallwayName;
  
  context.fillText(displayName, canvas.width / 2, canvas.height / 2);
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  // Create sprite material
  const material = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true
  });
  
  // Create and scale the sprite
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(50, 15, 1);
  
  return sprite;
}
