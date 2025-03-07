
import * as THREE from 'three';
import { FloorPlanNode } from '../../types/floorPlanTypes';

export function createHallway3D(node: FloorPlanNode, isSelected: boolean = false): THREE.Object3D {
  // Get hallway properties
  const { width, height } = node.data.size;
  const depth = 20; // Lower height than rooms
  
  // Get hallway-specific properties
  const hallwayType = node.data.properties?.hallwayType || 'public_main';
  const trafficFlow = node.data.properties?.trafficFlow || 'two_way';
  const accessibility = node.data.properties?.accessibility || 'fully_accessible';
  
  // Determine color based on hallway type and properties
  let color;
  let opacity = 0.7; // Default transparency for hallways
  
  if (hallwayType === 'private') {
    color = 0xddd6fe; // Light purple for private hallways
  } else {
    color = 0xdbeafe; // Light blue for public hallways
  }
  
  // Adjust appearance based on accessibility
  if (accessibility === 'limited_access' || accessibility === 'restricted') {
    const c = new THREE.Color(color);
    c.offsetHSL(0, 0, -0.1); // Darken for limited access
    color = c.getHex();
  }
  
  // Create hallway geometry
  const geometry = new THREE.BoxGeometry(width, depth, height);
  
  const material = new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity,
    roughness: 0.8,
    metalness: 0.1
  });
  
  // Create mesh
  const hallway = new THREE.Mesh(geometry, material);
  hallway.castShadow = true;
  hallway.receiveShadow = true;
  
  // Position the hallway
  hallway.position.set(node.position.x, depth / 2, node.position.y);
  
  // Rotate if needed
  if (node.rotation) {
    hallway.rotation.y = -node.rotation * (Math.PI / 180);
  }
  
  // Add traffic flow indicators
  if (trafficFlow === 'one_way') {
    // Add arrow indicators for one-way hallways
    const arrowLength = width * 0.8;
    const arrowGeometry = new THREE.BufferGeometry();
    const arrowMaterial = new THREE.LineBasicMaterial({ color: 0x475569 });
    
    const points = [];
    points.push(new THREE.Vector3(-arrowLength/2, 0, 0));
    points.push(new THREE.Vector3(arrowLength/2, 0, 0));
    points.push(new THREE.Vector3(arrowLength/3, 0, -10));
    points.push(new THREE.Vector3(arrowLength/2, 0, 0));
    points.push(new THREE.Vector3(arrowLength/3, 0, 10));
    
    arrowGeometry.setFromPoints(points);
    const arrow = new THREE.Line(arrowGeometry, arrowMaterial);
    arrow.position.y = depth + 1;
    hallway.add(arrow);
  }
  
  // Add highlights for selected hallway
  if (isSelected) {
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edgeGeometry, lineMaterial);
    hallway.add(wireframe);
    
    // Add a subtle glow effect
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
    hallway.add(glowMesh);
  }
  
  // Add label
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;
  
  if (context) {
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '20px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#333333';
    context.fillText(node.data.label || 'Hallway', canvas.width / 2, canvas.height / 2);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  
  const labelGeometry = new THREE.PlaneGeometry(80, 20);
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.set(0, depth + 5, 0);
  label.rotation.x = -Math.PI / 2;
  hallway.add(label);
  
  // Set userData for raycasting
  hallway.userData = { nodeId: node.id };
  
  return hallway;
}
