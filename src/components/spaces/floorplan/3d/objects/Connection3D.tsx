
import * as THREE from 'three';
import { FloorPlanNode, FloorPlanEdge } from '../../types/floorPlanTypes';

export function createConnection3D(
  sourceNode: FloorPlanNode, 
  targetNode: FloorPlanNode, 
  edge: FloorPlanEdge
): THREE.Object3D {
  // Create a group to hold the connection
  const connectionGroup = new THREE.Group();
  
  // Get positions
  const sourcePos = new THREE.Vector3(sourceNode.position.x, 15, sourceNode.position.y);
  const targetPos = new THREE.Vector3(targetNode.position.x, 15, targetNode.position.y);
  
  // Determine connection type and style
  const isTransitionDoor = edge.data?.isTransitionDoor || false;
  const isSecured = edge.data?.isSecured || false;
  const connectionType = edge.data?.type || 'doorway';
  
  // Determine color based on connection type
  let color = 0x94a3b8; // Default connection color
  
  if (connectionType === 'door') {
    color = 0x64748b; // Standard door color
  } else if (isSecured) {
    color = 0xef4444; // Red for secured/restricted access
  } else if (isTransitionDoor) {
    color = 0x3b82f6; // Blue for transition points
  }
  
  // Adjust connection based on hallway positioning if applicable
  if (sourceNode.type === 'hallway' || targetNode.type === 'hallway') {
    const hallwayNode = sourceNode.type === 'hallway' ? sourceNode : targetNode;
    const otherNode = sourceNode.type === 'hallway' ? targetNode : sourceNode;
    const hallwayPosition = edge.data?.hallwayPosition || 0.5;
    const hallwayWidth = hallwayNode.data.size.width;
    const hallwayHeight = hallwayNode.data.size.height;
    
    // Calculate position based on hallway position value
    let offsetX = 0;
    let offsetZ = 0;
    
    if (hallwayNode.rotation === 0 || hallwayNode.rotation === 180) {
      // Hallway runs east-west
      offsetX = (hallwayWidth * (hallwayPosition - 0.5));
      
      if (edge.data?.position === 'lateral') {
        offsetZ = hallwayHeight / 2 * (sourceNode.type === 'hallway' ? 1 : -1);
      }
    } else {
      // Hallway runs north-south
      offsetZ = (hallwayHeight * (hallwayPosition - 0.5));
      
      if (edge.data?.position === 'lateral') {
        offsetX = hallwayWidth / 2 * (sourceNode.type === 'hallway' ? 1 : -1);
      }
    }
    
    // Apply offset to the hallway position
    if (sourceNode.type === 'hallway') {
      sourcePos.x += offsetX * Math.cos(hallwayNode.rotation || 0 * (Math.PI / 180));
      sourcePos.z += offsetZ * Math.sin(hallwayNode.rotation || 0 * (Math.PI / 180));
    } else {
      targetPos.x += offsetX * Math.cos(hallwayNode.rotation || 0 * (Math.PI / 180));
      targetPos.z += offsetZ * Math.sin(hallwayNode.rotation || 0 * (Math.PI / 180));
    }
  }
  
  // Create line geometry for the connection
  const points = [sourcePos, targetPos];
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  
  // Line material based on connection type
  const lineMaterial = new THREE.LineBasicMaterial({
    color,
    linewidth: edge.data?.style?.strokeWidth || 2
  });
  
  // Create line
  const line = new THREE.Line(lineGeometry, lineMaterial);
  connectionGroup.add(line);
  
  // Add indicators for special connections
  if (isTransitionDoor || isSecured) {
    // Create an indicator at the midpoint
    const midPoint = new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);
    
    // Indicator geometry
    const indicatorGeometry = isSecured 
      ? new THREE.OctahedronGeometry(5) // Octahedron for secured connections
      : new THREE.SphereGeometry(5); // Sphere for transition doors
      
    const indicatorMaterial = new THREE.MeshBasicMaterial({ color });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.copy(midPoint);
    connectionGroup.add(indicator);
  }
  
  // Set userData for raycasting
  connectionGroup.userData = { edgeId: edge.id };
  
  return connectionGroup;
}
