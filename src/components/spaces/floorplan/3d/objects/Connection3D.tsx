
import * as THREE from 'three';
import { FloorPlanNode, FloorPlanEdge } from '../../types/floorPlanTypes';

export function createConnection3D(
  sourceNode: FloorPlanNode, 
  targetNode: FloorPlanNode, 
  edge: FloorPlanEdge
): THREE.Object3D | null {
  // No connection if either node is missing
  if (!sourceNode || !targetNode) return null;
  
  // Get positions
  const sourcePos = new THREE.Vector3(sourceNode.position.x, 30, sourceNode.position.y);
  const targetPos = new THREE.Vector3(targetNode.position.x, 30, targetNode.position.y);
  
  // Create a group to hold connection objects
  const connectionGroup = new THREE.Group();
  
  // Calculate direction and length
  const direction = new THREE.Vector3().subVectors(targetPos, sourcePos);
  const length = direction.length();
  
  // Create connection line
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, length)
  ]);
  
  // Determine line color based on connection type
  let lineColor = '#888888'; // Default gray
  
  if (edge.data) {
    if (edge.data.type === 'door') {
      lineColor = '#a0522d'; // Brown for door connections
    } else if (edge.data.isTransitionDoor) {
      lineColor = '#3b82f6'; // Blue for transition connections
    } else if (edge.data.isSecured) {
      lineColor = '#ef4444'; // Red for secured connections
    }
  }
  
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: lineColor,
    linewidth: 2
  });
  
  const line = new THREE.Line(lineGeometry, lineMaterial);
  
  // Orient the line to point from source to target
  line.position.copy(sourcePos);
  line.lookAt(targetPos);
  
  // Add line to group
  connectionGroup.add(line);
  
  // Add connection ID for later reference
  connectionGroup.userData = { edgeId: edge.id };
  
  return connectionGroup;
}
