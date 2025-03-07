
import * as THREE from 'three';
import { SpaceType } from '../types/floorPlanTypes';

// Material presets for different space types
export const createMaterial = (
  type: SpaceType | string, 
  isSelected: boolean = false,
  customColor?: string
): THREE.Material => {
  const baseColor = customColor || getMaterialColor(type);
  
  switch (type) {
    case 'room':
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(baseColor),
        roughness: 0.7,
        metalness: 0.2,
        flatShading: false,
        emissive: isSelected ? new THREE.Color(0x333333) : new THREE.Color(0x000000),
        emissiveIntensity: isSelected ? 0.2 : 0,
        transparent: true,
        opacity: 0.9,
      });
    
    case 'hallway':
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(baseColor),
        roughness: 0.9,
        metalness: 0.1, 
        transparent: true,
        opacity: 0.8,
        emissive: isSelected ? new THREE.Color(0x333333) : new THREE.Color(0x000000),
        emissiveIntensity: isSelected ? 0.2 : 0
      });
      
    case 'door':
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(baseColor),
        roughness: 0.5,
        metalness: 0.4,
        emissive: isSelected ? new THREE.Color(0x555555) : new THREE.Color(0x000000),
        emissiveIntensity: isSelected ? 0.3 : 0
      });
      
    default:
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(baseColor),
        roughness: 0.7,
        metalness: 0.1
      });
  }
};

// Get color based on space type
export const getMaterialColor = (type: SpaceType | string, properties?: any): string => {
  switch (type) {
    case 'room':
      const roomType = properties?.room_type || 'default';
      return roomColorMap[roomType] || roomColorMap.default;
    case 'hallway':
      return '#e5e7eb';
    case 'door':
      return '#94a3b8';
    default:
      return '#e2e8f0';
  }
};

// Room colors based on room type
export const roomColorMap: Record<string, string> = {
  office: '#e2e8f0',
  courtroom: '#dbeafe',
  storage: '#f1f5f9',
  conference: '#fef3c7',
  library: '#d1fae5',
  default: '#e2e8f0'
};

// Create floor material
export const createFloorMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: '#f3f4f6',
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.FrontSide
  });
};

// Create a text sprite for labels
export const createTextSprite = (
  text: string,
  fontSize: number = 24,
  fontFace: string = 'Arial',
  textColor: string = '#000000',
  backgroundColor: string = 'rgba(255,255,255,0.5)'
): THREE.Sprite => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');
  
  // Set canvas dimensions
  canvas.width = 256;
  canvas.height = 128;
  
  // Draw background
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw text
  context.font = `${fontSize}px ${fontFace}`;
  context.fillStyle = textColor;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Create sprite material
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(10, 5, 1);
  
  return sprite;
};

// Create improved lighting setup
export const createLighting = (scene: THREE.Scene) => {
  // Clear existing lights
  scene.children.forEach(child => {
    if (child instanceof THREE.Light) {
      scene.remove(child);
    }
  });
  
  // Ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  // Main directional light (sun-like)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(300, 300, 300);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 2000;
  directionalLight.shadow.camera.left = -500;
  directionalLight.shadow.camera.right = 500;
  directionalLight.shadow.camera.top = 500;
  directionalLight.shadow.camera.bottom = -500;
  scene.add(directionalLight);
  
  // Secondary light from opposite side
  const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.4);
  secondaryLight.position.set(-300, 200, -300);
  secondaryLight.castShadow = true;
  scene.add(secondaryLight);
  
  // Hemisphere light for subtle coloring
  const hemisphereLight = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 0.5);
  scene.add(hemisphereLight);
  
  return { ambientLight, directionalLight, secondaryLight, hemisphereLight };
};

// Create a gradient environment
export const createEnvironment = () => {
  const skyColor = new THREE.Color('#e0f2fe');
  const groundColor = new THREE.Color('#f8fafc');
  
  return { skyColor, groundColor };
};

export const createTooltipData = (object: any) => {
  if (!object) return null;
  
  const { id, type, position, size, properties } = object;
  
  let tooltipContent = {
    title: properties?.room_number ? `Room ${properties.room_number}` : type.charAt(0).toUpperCase() + type.slice(1),
    details: []
  };
  
  switch (type) {
    case 'room':
      tooltipContent.details = [
        { label: 'Type', value: properties?.room_type || 'Standard' },
        { label: 'Status', value: properties?.status || 'Active' },
        { label: 'Size', value: `${size.width}×${size.height}` }
      ];
      break;
    case 'hallway':
      tooltipContent.details = [
        { label: 'Section', value: properties?.section || 'Main' },
        { label: 'Traffic', value: properties?.traffic_flow || 'Two-way' },
        { label: 'Access', value: properties?.accessibility || 'Public' }
      ];
      break;
    case 'door':
      tooltipContent.details = [
        { label: 'Type', value: properties?.door_type || 'Standard' },
        { label: 'Status', value: properties?.status || 'Operational' }
      ];
      break;
  }
  
  return tooltipContent;
};
