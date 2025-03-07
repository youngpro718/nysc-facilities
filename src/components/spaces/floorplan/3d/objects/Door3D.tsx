
import * as THREE from 'three';
import { FloorPlanNode } from '../../types/floorPlanTypes';

export function createDoor3D(node: FloorPlanNode, isSelected: boolean = false): THREE.Object3D {
  // Create parent object to hold all door components
  const doorObject = new THREE.Object3D();
  
  // Get dimensions and properties
  const { width, height } = node.data.size;
  const doorHeight = 80; // Taller than rooms/hallways
  const doorThickness = 10;
  
  // Door frame
  const frameGeometry = new THREE.BoxGeometry(width + 10, doorHeight, doorThickness + 5);
  const frameMaterial = new THREE.MeshStandardMaterial({ 
    color: isSelected ? '#aaccff' : '#8b4513', // Brown wood color for frame
    roughness: 0.7,
    metalness: 0.2
  });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  
  // Door panel
  const doorGeometry = new THREE.BoxGeometry(width, doorHeight - 10, doorThickness);
  const doorMaterial = new THREE.MeshStandardMaterial({ 
    color: isSelected ? '#aaccff' : '#a0522d', // Darker brown for door
    roughness: 0.5,
    metalness: 0.3
  });
  
  // If it's a security door, use different color
  const isSecurityDoor = node.data.properties?.security_level === 'high' || 
                          node.data.properties?.security_level === 'restricted';
  
  if (isSecurityDoor && !isSelected) {
    doorMaterial.color = new THREE.Color('#8B0000'); // Dark red for security doors
  }
  
  const doorPanel = new THREE.Mesh(doorGeometry, doorMaterial);
  
  // Door handle
  const handleGeometry = new THREE.SphereGeometry(5, 8, 8);
  const handleMaterial = new THREE.MeshStandardMaterial({ 
    color: isSelected ? '#ffffff' : '#c0c0c0',
    roughness: 0.2,
    metalness: 0.8
  });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.set(width/3, 0, doorThickness/2 + 2);
  
  // Position in 3D space
  doorObject.position.set(node.position.x, doorHeight/2, node.position.y);
  
  // Apply rotation if available
  if (node.rotation) {
    doorObject.rotation.y = (node.rotation * Math.PI) / 180;
  }
  
  // Add shadows
  frame.castShadow = true;
  doorPanel.castShadow = true;
  handle.castShadow = true;
  
  // Add all components to the door object
  doorObject.add(frame);
  doorObject.add(doorPanel);
  doorObject.add(handle);
  
  // Add userData for raycasting
  doorObject.userData = { nodeId: node.id };
  
  // Create and add door label
  const doorLabel = createDoorLabel(node);
  doorLabel.position.set(0, doorHeight + 5, 0);
  doorObject.add(doorLabel);
  
  return doorObject;
}

function createDoorLabel(node: FloorPlanNode): THREE.Object3D {
  // Get door properties
  const doorNumber = node.data.properties?.room_number || '';
  
  // If no door number, create minimal label
  if (!doorNumber) {
    const simpleGeometry = new THREE.BoxGeometry(5, 5, 5);
    const simpleMaterial = new THREE.MeshBasicMaterial({ color: '#ff0000' });
    const simpleMesh = new THREE.Mesh(simpleGeometry, simpleMaterial);
    return simpleMesh;
  }
  
  // Create canvas for texture
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Object3D(); // fallback
  
  canvas.width = 128;
  canvas.height = 64;
  
  // Set background with transparency
  context.fillStyle = 'rgba(255, 255, 255, 0.8)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw door number
  context.fillStyle = '#000000';
  context.font = 'Bold 24px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(doorNumber, canvas.width / 2, canvas.height / 2);
  
  // Create texture and sprite
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true
  });
  
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(20, 10, 1);
  
  return sprite;
}
