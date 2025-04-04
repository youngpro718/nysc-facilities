import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
// Let's create a simple placeholder 3D scene for now and we'll add proper integration later

interface ThreeDSceneProps {
  floorId: string;
  selectedObjectId?: string;
  zoom?: number;
  showLabels?: boolean;
  previewData?: any;
  onObjectSelect?: (object: any) => void;
}

const ThreeDScene: React.FC<ThreeDSceneProps> = ({
  floorId,
  selectedObjectId,
  zoom = 1,
  showLabels = true,
  previewData,
  onObjectSelect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create a simple Three.js scene as a placeholder
    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      
      const camera = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 0, 0);
      
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      
      // Clear the container before adding the canvas
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      containerRef.current.appendChild(renderer.domElement);
      
      // Add some basic lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
      
      // Add a grid to represent the floor
      const gridHelper = new THREE.GridHelper(20, 20);
      scene.add(gridHelper);
      
      // Add a simple placeholder for the floor
      const floorGeometry = new THREE.PlaneGeometry(20, 20);
      const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      scene.add(floor);
      
      // Create a simple box to represent each room
      // This is placeholder functionality - we'd load actual data in a real implementation
      const createBox = (x: number, z: number, width: number, depth: number, color: number, name: string) => {
        const geometry = new THREE.BoxGeometry(width, 0.1, depth);
        const material = new THREE.MeshStandardMaterial({ color });
        const box = new THREE.Mesh(geometry, material);
        box.position.set(x, 0.05, z);
        box.userData = { id: `room-${x}-${z}`, name, type: 'room' };
        scene.add(box);
        return box;
      };
      
      // Create sample rooms
      const rooms = [
        createBox(-3, -2, 2, 3, 0x9fdfbf, 'Office 101'),
        createBox(0, -2, 2, 3, 0xaad9ff, 'Meeting Room'),
        createBox(3, -2, 2, 3, 0xffb6c1, 'Storage'),
        createBox(-3, 2, 2, 3, 0xffffb0, 'Office 102'),
        createBox(0, 2, 2, 3, 0xd8bfd8, 'Hallway'),
        createBox(3, 2, 2, 3, 0xffcba4, 'Reception')
      ];
      
      // Highlight the selected object if any
      if (selectedObjectId) {
        rooms.forEach(room => {
          if (room.userData.id === selectedObjectId) {
            const highlightMaterial = new THREE.MeshStandardMaterial({ 
              color: 0xff9900,
              emissive: 0xff6600,
              emissiveIntensity: 0.2
            });
            room.material = highlightMaterial;
          }
        });
      }
      
      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current) return;
        
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Simple animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      
      animate();
      setIsLoading(false);
      
      // Handle clicks
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      
      const handleClick = (event: MouseEvent) => {
        if (!containerRef.current) return;
        
        // Calculate mouse position in normalized device coordinates
        const rect = containerRef.current.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children);
        
        if (intersects.length > 0) {
          const selectedObject = intersects[0].object;
          if (selectedObject.userData && selectedObject.userData.id && onObjectSelect) {
            onObjectSelect(selectedObject.userData);
          }
        }
      };
      
      containerRef.current.addEventListener('click', handleClick);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        if (containerRef.current) {
          containerRef.current.removeEventListener('click', handleClick);
        }
        renderer.dispose();
      };
    } catch (err) {
      console.error('Error initializing 3D scene:', err);
      setError('Failed to initialize 3D scene');
      setIsLoading(false);
    }
  }, [floorId, selectedObjectId, zoom, showLabels, previewData, onObjectSelect]);
  
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}. Please try refreshing the page.
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeDScene;
