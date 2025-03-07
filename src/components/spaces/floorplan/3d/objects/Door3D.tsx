
import * as THREE from 'three';
import { FloorPlanNode } from '../../types/floorPlanTypes';

export function createDoor3D(node: FloorPlanNode, isSelected: boolean = false): THREE.Object3D {
  // Get door properties
  const { width = 40, height = 10 } = node.data.size;
  const doorHeight = 40; // Standard door height
  
  // Determine door properties
  const isDoor = node.data.type === 'door';
  const isTransition = node.data.properties?.isTransitionDoor || false;
  const isSecured = node.data.properties?.isSecured || false;
  
  // Determine color based on door type
  let color = 0x64748b; // Default door color
  
  if (isTransition) {
    color = 0x3b82f6; // Blue for transition doors
  } else if (isSecured) {
    color = 0xef4444; // Red for secured doors
  }
  
  // Create door group
  const doorGroup = new THREE.Group();
  
  // Create door geometry
  const doorGeometry = new THREE.BoxGeometry(width, doorHeight, height);
  
  const doorMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0.3
  });
  
  // Create mesh
  const door = new THREE.Mesh(doorGeometry, doorMaterial);
  door.castShadow = true;
  
  // Position the door
  door.position.set(0, doorHeight / 2, 0);
  doorGroup.position.set(node.position.x, 0, node.position.y);
  
  // Rotate if needed
  if (node.rotation) {
    doorGroup.rotation.y = -node.rotation * (Math.PI / 180);
  }
  
  // Add door frame
  const frameThickness = 5;
  const frameWidth = width + frameThickness * 2;
  const frameHeight = doorHeight + frameThickness;
  
  // Frame sides
  const frameSideGeometry = new THREE.BoxGeometry(frameThickness, frameHeight, height);
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.9,
    metalness: 0.1
  });
  
  const leftFrame = new THREE.Mesh(frameSideGeometry, frameMaterial);
  leftFrame.position.set(-width/2 - frameThickness/2, doorHeight/2, 0);
  
  const rightFrame = new THREE.Mesh(frameSideGeometry, frameMaterial);
  rightFrame.position.set(width/2 + frameThickness/2, doorHeight/2, 0);
  
  // Frame top
  const frameTopGeometry = new THREE.BoxGeometry(frameWidth, frameThickness, height);
  const topFrame = new THREE.Mesh(frameTopGeometry, frameMaterial);
  topFrame.position.set(0, doorHeight + frameThickness/2, 0);
  
  doorGroup.add(door, leftFrame, rightFrame, topFrame);
  
  // Add security indicator for secured doors
  if (isSecured) {
    const securityGeometry = new THREE.SphereGeometry(5, 16, 16);
    const securityMaterial = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const securityIndicator = new THREE.Mesh(securityGeometry, securityMaterial);
    securityIndicator.position.set(0, doorHeight * 0.7, height / 2 + 3);
    doorGroup.add(securityIndicator);
  }
  
  // Add highlights for selected door
  if (isSelected) {
    const edgeGeometry = new THREE.EdgesGeometry(doorGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edgeGeometry, lineMaterial);
    door.add(wireframe);
    
    // Add a subtle glow effect
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(width + 4, doorHeight + 4, height + 4),
      glowMaterial
    );
    door.add(glowMesh);
  }
  
  // Set userData for raycasting
  doorGroup.userData = { nodeId: node.id };
  
  return doorGroup;
}
