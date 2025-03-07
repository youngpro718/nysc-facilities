
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Note the .js extension
import { FloorPlanNode, FloorPlanEdge, ROOM_COLORS } from '../types/floorPlanTypes';
import { SceneControls } from './SceneControls';
import { createRoom3D } from './objects/Room3D';
import { createHallway3D } from './objects/Hallway3D';
import { createDoor3D } from './objects/Door3D';
import { createConnection3D } from './objects/Connection3D';

interface Scene3DProps {
  nodes: FloorPlanNode[];
  edges: FloorPlanEdge[];
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId?: string;
}

export function Scene3D({ nodes, edges, onSelectNode, selectedNodeId }: Scene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const objectsRef = useRef<Map<string, THREE.Object3D>>(new Map());

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      60, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      5000
    );
    camera.position.set(0, 500, 500);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Add directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 300, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    scene.add(directionalLight);

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xeeeeee,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = -0.5;
    scene.add(ground);

    // Add grid
    const grid = new THREE.GridHelper(2000, 100, 0x888888, 0xdddddd);
    (grid.material as THREE.Material).opacity = 0.3;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    // Animation loop
    const animate = function () {
      requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      scene.clear();
    };
  }, []);

  // Update objects when nodes or edges change
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Clear old objects
    objectsRef.current.forEach(obj => {
      sceneRef.current?.remove(obj);
    });
    objectsRef.current.clear();

    // Add new objects
    nodes.forEach(node => {
      let object: THREE.Object3D | null = null;
      
      if (node.type === 'room') {
        object = createRoom3D(node, selectedNodeId === node.id);
      } else if (node.type === 'hallway') {
        object = createHallway3D(node, selectedNodeId === node.id);
      } else if (node.type === 'door') {
        object = createDoor3D(node, selectedNodeId === node.id);
      }
      
      if (object) {
        // Add click event
        (object as any).userData = { nodeId: node.id };
        sceneRef.current?.add(object);
        objectsRef.current.set(node.id, object);
      }
    });

    // Add connections/edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const connection = createConnection3D(sourceNode, targetNode, edge);
        if (connection) {
          sceneRef.current?.add(connection);
          objectsRef.current.set(edge.id, connection);
        }
      }
    });

    // Set up raycaster for object selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
      
      // Calculate mouse position in normalized device coordinates
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, cameraRef.current);
      
      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      
      if (intersects.length > 0) {
        // Find the first intersected object that has a nodeId
        for (const intersect of intersects) {
          let obj = intersect.object;
          
          // Traverse up to find parent with userData
          while (obj && (!obj.userData || !obj.userData.nodeId)) {
            obj = obj.parent as THREE.Object3D;
          }
          
          if (obj && obj.userData && obj.userData.nodeId) {
            if (onSelectNode) {
              onSelectNode(obj.userData.nodeId);
            }
            break;
          }
        }
      }
    };

    containerRef.current?.addEventListener('click', onClick);
    
    return () => {
      containerRef.current?.removeEventListener('click', onClick);
    };
  }, [nodes, edges, selectedNodeId, onSelectNode]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <SceneControls 
        onReset={() => {
          if (cameraRef.current && controlsRef.current) {
            cameraRef.current.position.set(0, 500, 500);
            cameraRef.current.lookAt(0, 0, 0);
            controlsRef.current.update();
          }
        }}
      />
    </div>
  );
}
