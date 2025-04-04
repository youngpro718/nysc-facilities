
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export interface ThreeDSceneProps {
  objects: any[];
  selectedObjectId?: string | null;
  previewData?: any;
  onSelectObject?: (object: any) => void;
}

export function ThreeDScene({ 
  objects, 
  selectedObjectId, 
  previewData,
  onSelectObject 
}: ThreeDSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Three.js scene
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 10, 10);
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controlsRef.current = controls;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Clean up resources
      meshesRef.current.clear();
    };
  }, []);

  // Add object meshes to scene
  useEffect(() => {
    if (!sceneRef.current || !objects.length) return;

    // Clear existing objects
    meshesRef.current.forEach((mesh) => {
      sceneRef.current?.remove(mesh);
    });
    meshesRef.current.clear();

    objects.forEach((object) => {
      let geometry;
      let material;
      let mesh;

      // Create different geometries based on object type
      switch (object.type) {
        case 'room':
          geometry = new THREE.BoxGeometry(
            object.data?.size?.width / 100 || 1.5,
            0.1,
            object.data?.size?.height / 100 || 1
          );
          material = new THREE.MeshStandardMaterial({
            color: 0x90caf9,
            transparent: true,
            opacity: 0.8
          });
          break;
          
        case 'hallway':
          geometry = new THREE.BoxGeometry(
            object.data?.size?.width / 100 || 3,
            0.05,
            object.data?.size?.height / 100 || 0.5
          );
          material = new THREE.MeshStandardMaterial({
            color: 0xc5e1a5,
            transparent: true,
            opacity: 0.7
          });
          break;
          
        case 'door':
          geometry = new THREE.BoxGeometry(
            object.data?.size?.width / 100 || 0.6,
            0.15,
            object.data?.size?.height / 100 || 0.2
          );
          material = new THREE.MeshStandardMaterial({
            color: 0xbcaaa4
          });
          break;
          
        default:
          geometry = new THREE.BoxGeometry(1, 0.1, 1);
          material = new THREE.MeshStandardMaterial({
            color: 0xe0e0e0
          });
      }

      mesh = new THREE.Mesh(geometry, material);

      // Position the object
      const posX = (object.position?.x || 0) / 100;
      const posZ = (object.position?.y || 0) / 100;
      mesh.position.set(posX, 0, posZ);

      // Apply rotation if available
      if (object.rotation) {
        mesh.rotation.y = THREE.MathUtils.degToRad(object.rotation);
      }

      // Store reference to the original data
      mesh.userData = { ...object };

      // Add to scene and references
      sceneRef.current.add(mesh);
      meshesRef.current.set(object.id, mesh);

      // Add click event using raycaster
      mesh.userData.onClick = () => {
        if (onSelectObject) {
          onSelectObject(object);
        }
      };
    });

    // Setup raycaster for object selection
    const setupRaycaster = () => {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onMouseClick = (event: MouseEvent) => {
        if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(sceneRef.current.children);

        if (intersects.length > 0) {
          const selectedObject = intersects[0].object;
          if (selectedObject.userData?.onClick) {
            selectedObject.userData.onClick();
          }
        }
      };

      containerRef.current.addEventListener('click', onMouseClick);

      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener('click', onMouseClick);
        }
      };
    };

    const cleanupRaycaster = setupRaycaster();
    return () => {
      if (cleanupRaycaster) cleanupRaycaster();
    };
  }, [objects, onSelectObject]);

  // Update selected object appearance
  useEffect(() => {
    meshesRef.current.forEach((mesh, id) => {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        if (id === selectedObjectId) {
          // Highlight selected object
          mesh.material.emissive.set(0x444444);
          mesh.position.y = 0.05; // Lift slightly
        } else {
          // Reset others
          mesh.material.emissive.set(0x000000);
          mesh.position.y = 0;
        }
      }
    });
  }, [selectedObjectId]);

  // Apply preview changes if available
  useEffect(() => {
    if (!previewData || !previewData.id) return;
    
    const mesh = meshesRef.current.get(previewData.id);
    if (!mesh) return;
    
    // Update position
    if (previewData.position) {
      mesh.position.x = previewData.position.x / 100;
      mesh.position.z = previewData.position.y / 100;
    }
    
    // Update rotation
    if (previewData.rotation !== undefined) {
      mesh.rotation.y = THREE.MathUtils.degToRad(previewData.rotation);
    }
    
    // Update size if provided
    if (previewData.data?.size) {
      // We'd need to create a new geometry with the updated dimensions
      // This is simplified - in a real app you might swap the entire mesh
      const width = previewData.data.size.width / 100;
      const height = previewData.data.size.height / 100;
      
      // For demonstration, we'll just log
      console.log(`Size update for ${previewData.id}:`, width, height);
    }
  }, [previewData]);

  return <div ref={containerRef} className="h-full w-full" />;
}
