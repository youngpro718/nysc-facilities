/**
 * FloorPlan3DCanvas - Clean 3D floor plan renderer using Three.js
 */

import { useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { cn } from '@/lib/utils';

interface FloorPlan3DCanvasProps {
  objects: any[];
  edges: any[];
  selectedObjectId: string | null;
  onObjectSelect: (id: string | null) => void;
  showLabels: boolean;
  showConnections: boolean;
  fitViewTrigger?: number;
}

// Color palette for different room types
const ROOM_TYPE_COLORS = {
  // Courtrooms - Distinguished with rich wood tones
  courtroom: { walls: 0x8b4513, floor: 0xdeb887, accent: 0x654321 },
  // Offices - Professional blue
  office: { walls: 0x3b82f6, floor: 0xf0f9ff, accent: 0x1d4ed8 },
  // Conference rooms - Modern gray
  conference: { walls: 0x6366f1, floor: 0xf5f5f5, accent: 0x4f46e5 },
  conference_room: { walls: 0x6366f1, floor: 0xf5f5f5, accent: 0x4f46e5 },
  // Storage - Neutral
  storage: { walls: 0x78716c, floor: 0xe7e5e4, accent: 0x57534e },
  // Restroom - Clean white/blue
  restroom: { walls: 0x06b6d4, floor: 0xecfeff, accent: 0x0891b2 },
  // Utility - Industrial
  utility: { walls: 0x71717a, floor: 0xd4d4d8, accent: 0x52525b },
  // Jury room - Formal
  jury_room: { walls: 0x7c3aed, floor: 0xf5f3ff, accent: 0x6d28d9 },
  // Chamber - Executive
  chamber: { walls: 0x0f766e, floor: 0xf0fdfa, accent: 0x115e59 },
  // Filing room
  filing_room: { walls: 0xea580c, floor: 0xfff7ed, accent: 0xc2410c },
  // Default
  default: { walls: 0x64748b, floor: 0xf8fafc, accent: 0x475569 },
};

const COLORS = {
  room: { base: 0x3b82f6, hover: 0x60a5fa, selected: 0x1d4ed8 },
  hallway: { base: 0x64748b, hover: 0x94a3b8, selected: 0x475569 },
  door: { base: 0xf59e0b, hover: 0xfbbf24, selected: 0xd97706 },
  floor: 0xf8fafc,
  grid: 0xe2e8f0,
  connection: 0x94a3b8,
  background: 0xf1f5f9,
};

// Get room type colors
function getRoomTypeColors(roomType: string | undefined) {
  if (!roomType) return ROOM_TYPE_COLORS.default;
  const normalized = roomType.toLowerCase().replace(/\s+/g, '_');
  return ROOM_TYPE_COLORS[normalized as keyof typeof ROOM_TYPE_COLORS] || ROOM_TYPE_COLORS.default;
}

export function FloorPlan3DCanvas({
  objects,
  edges,
  selectedObjectId,
  onObjectSelect,
  showLabels,
  showConnections,
  fitViewTrigger = 0,
}: FloorPlan3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const layoutBoundsRef = useRef({ width: 500, depth: 500 });

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
    camera.position.set(400, 350, 400);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 100;
    controls.maxDistance = 1000;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(300, 400, 300);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-200, 200, -200);
    scene.add(fillLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: COLORS.floor,
      transparent: true,
      opacity: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(1000, 50, COLORS.grid, COLORS.grid);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Create 3D objects
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear existing meshes
    meshMapRef.current.forEach((group) => {
      scene.remove(group);
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    meshMapRef.current.clear();

    // Calculate bounding box and center offset
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    objects.forEach(obj => {
      const x = obj.position?.x || 0;
      const z = obj.position?.y || 0;
      const w = obj.data?.size?.width || 100;
      const h = obj.data?.size?.height || 100;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + w);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z + h);
    });
    
    // Handle case with no objects
    if (!Number.isFinite(minX)) {
      minX = 0; maxX = 100; minZ = 0; maxZ = 100;
    }
    
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const layoutWidth = Math.max(maxX - minX, 200);
    const layoutDepth = Math.max(maxZ - minZ, 200);
    
    // Store bounds for fit view
    layoutBoundsRef.current = { width: layoutWidth, depth: layoutDepth };
    
    console.log('[3D] Layout bounds:', { minX, maxX, minZ, maxZ, centerX, centerZ, layoutWidth, layoutDepth });

    // Create meshes for each object
    objects.forEach((obj) => {
      const group = new THREE.Group();
      group.userData = { id: obj.id, type: obj.type };

      const x = (obj.position?.x || 0) - centerX;
      const z = (obj.position?.y || 0) - centerZ;
      const width = obj.data?.size?.width || 100;
      const depth = obj.data?.size?.height || 100;
      const isSelected = obj.id === selectedObjectId;

      const colorSet = obj.type === 'room' ? COLORS.room : 
                       obj.type === 'hallway' ? COLORS.hallway : 
                       obj.type === 'door' ? COLORS.door : COLORS.room;
      const color = isSelected ? colorSet.selected : colorSet.base;

      if (obj.type === 'room') {
        const roomType = obj.data?.properties?.room_type || obj.data?.properties?.space_type;
        const typeColors = getRoomTypeColors(roomType);
        const isCourtroom = roomType?.toLowerCase().includes('courtroom');
        const isChamber = roomType?.toLowerCase().includes('chamber');
        const isConference = roomType?.toLowerCase().includes('conference');
        
        // Adjust wall height based on room type
        const wallHeight = isCourtroom ? 45 : isChamber ? 40 : 30;
        const wallThickness = 2;

        // Floor with room-type specific color
        const floorGeo = new THREE.BoxGeometry(width, 2, depth);
        const floorMat = new THREE.MeshLambertMaterial({ color: typeColors.floor });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(x + width/2, 1, z + depth/2);
        floor.castShadow = true;
        floor.receiveShadow = true;
        group.add(floor);

        // Walls with room-type specific color
        const wallColor = isSelected ? COLORS.room.selected : typeColors.walls;
        const wallMat = new THREE.MeshLambertMaterial({ color: wallColor, transparent: true, opacity: 0.85 });
        
        // Front wall
        const frontWall = new THREE.Mesh(new THREE.BoxGeometry(width, wallHeight, wallThickness), wallMat);
        frontWall.position.set(x + width/2, wallHeight/2, z + depth);
        frontWall.castShadow = true;
        group.add(frontWall);

        // Back wall
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, wallHeight, wallThickness), wallMat);
        backWall.position.set(x + width/2, wallHeight/2, z);
        backWall.castShadow = true;
        group.add(backWall);

        // Left wall
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, depth), wallMat);
        leftWall.position.set(x, wallHeight/2, z + depth/2);
        leftWall.castShadow = true;
        group.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, depth), wallMat);
        rightWall.position.set(x + width, wallHeight/2, z + depth/2);
        rightWall.castShadow = true;
        group.add(rightWall);

        // === COURTROOM SPECIFIC FEATURES ===
        if (isCourtroom) {
          // Judge's bench (raised platform at back)
          const benchWidth = width * 0.6;
          const benchDepth = depth * 0.15;
          const benchHeight = 8;
          const benchGeo = new THREE.BoxGeometry(benchWidth, benchHeight, benchDepth);
          const benchMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 }); // Dark wood
          const bench = new THREE.Mesh(benchGeo, benchMat);
          bench.position.set(x + width/2, benchHeight/2 + 2, z + benchDepth/2 + 5);
          bench.castShadow = true;
          group.add(bench);

          // Witness stand (side)
          const witnessGeo = new THREE.BoxGeometry(width * 0.12, 6, depth * 0.1);
          const witnessMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
          const witness = new THREE.Mesh(witnessGeo, witnessMat);
          witness.position.set(x + width * 0.2, 5, z + depth * 0.2);
          witness.castShadow = true;
          group.add(witness);

          // Jury box (side area)
          const juryGeo = new THREE.BoxGeometry(width * 0.15, 4, depth * 0.4);
          const juryMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
          const jury = new THREE.Mesh(juryGeo, juryMat);
          jury.position.set(x + width * 0.08, 4, z + depth * 0.5);
          jury.castShadow = true;
          group.add(jury);

          // Counsel tables (two tables in center)
          const tableGeo = new THREE.BoxGeometry(width * 0.25, 3, depth * 0.12);
          const tableMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
          
          const table1 = new THREE.Mesh(tableGeo, tableMat);
          table1.position.set(x + width * 0.35, 3.5, z + depth * 0.6);
          table1.castShadow = true;
          group.add(table1);

          const table2 = new THREE.Mesh(tableGeo, tableMat);
          table2.position.set(x + width * 0.65, 3.5, z + depth * 0.6);
          table2.castShadow = true;
          group.add(table2);

          // Gallery railing
          const railGeo = new THREE.BoxGeometry(width * 0.8, 3, 1);
          const railMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
          const rail = new THREE.Mesh(railGeo, railMat);
          rail.position.set(x + width/2, 3.5, z + depth * 0.75);
          rail.castShadow = true;
          group.add(rail);

          // Flag poles (two at back corners)
          const poleGeo = new THREE.CylinderGeometry(0.5, 0.5, wallHeight * 0.8, 8);
          const poleMat = new THREE.MeshLambertMaterial({ color: 0xc0a060 }); // Gold
          
          const pole1 = new THREE.Mesh(poleGeo, poleMat);
          pole1.position.set(x + width * 0.15, wallHeight * 0.4, z + 8);
          group.add(pole1);

          const pole2 = new THREE.Mesh(poleGeo, poleMat);
          pole2.position.set(x + width * 0.85, wallHeight * 0.4, z + 8);
          group.add(pole2);
        }

        // === CHAMBER SPECIFIC FEATURES ===
        if (isChamber) {
          // Large desk
          const deskGeo = new THREE.BoxGeometry(width * 0.5, 4, depth * 0.2);
          const deskMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 }); // Dark mahogany
          const desk = new THREE.Mesh(deskGeo, deskMat);
          desk.position.set(x + width/2, 4, z + depth * 0.25);
          desk.castShadow = true;
          group.add(desk);

          // Bookshelf on back wall
          const shelfGeo = new THREE.BoxGeometry(width * 0.7, wallHeight * 0.6, 4);
          const shelfMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
          const shelf = new THREE.Mesh(shelfGeo, shelfMat);
          shelf.position.set(x + width/2, wallHeight * 0.35, z + 4);
          shelf.castShadow = true;
          group.add(shelf);

          // Seating area
          const sofaGeo = new THREE.BoxGeometry(width * 0.3, 4, depth * 0.15);
          const sofaMat = new THREE.MeshLambertMaterial({ color: 0x1a365d }); // Navy
          const sofa = new THREE.Mesh(sofaGeo, sofaMat);
          sofa.position.set(x + width * 0.75, 4, z + depth * 0.7);
          sofa.castShadow = true;
          group.add(sofa);
        }

        // === OFFICE FEATURES ===
        const isOffice = roomType?.toLowerCase().includes('office');
        if (isOffice && !isCourtroom && !isChamber && !isConference) {
          // Desk
          const deskGeo = new THREE.BoxGeometry(width * 0.35, 3, depth * 0.18);
          const deskMat = new THREE.MeshLambertMaterial({ color: 0x4b5563 });
          const desk = new THREE.Mesh(deskGeo, deskMat);
          desk.position.set(x + width * 0.3, 3.5, z + depth * 0.25);
          desk.castShadow = true;
          group.add(desk);

          // Chair
          const chairGeo = new THREE.BoxGeometry(5, 5, 5);
          const chairMat = new THREE.MeshLambertMaterial({ color: 0x1f2937 });
          const chair = new THREE.Mesh(chairGeo, chairMat);
          chair.position.set(x + width * 0.3, 4.5, z + depth * 0.4);
          chair.castShadow = true;
          group.add(chair);

          // Filing cabinet
          const cabinetGeo = new THREE.BoxGeometry(8, 12, 6);
          const cabinetMat = new THREE.MeshLambertMaterial({ color: 0x6b7280 });
          const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
          cabinet.position.set(x + width * 0.85, 8, z + depth * 0.15);
          cabinet.castShadow = true;
          group.add(cabinet);

          // Guest chairs
          const guestChairGeo = new THREE.BoxGeometry(4, 4, 4);
          const guestChair1 = new THREE.Mesh(guestChairGeo, chairMat);
          guestChair1.position.set(x + width * 0.5, 4, z + depth * 0.6);
          guestChair1.castShadow = true;
          group.add(guestChair1);

          const guestChair2 = new THREE.Mesh(guestChairGeo, chairMat);
          guestChair2.position.set(x + width * 0.65, 4, z + depth * 0.6);
          guestChair2.castShadow = true;
          group.add(guestChair2);
        }

        // === CONFERENCE ROOM FEATURES ===
        if (isConference) {
          // Conference table (oval-ish using box)
          const tableGeo = new THREE.BoxGeometry(width * 0.6, 3, depth * 0.4);
          const tableMat = new THREE.MeshLambertMaterial({ color: 0x374151 });
          const table = new THREE.Mesh(tableGeo, tableMat);
          table.position.set(x + width/2, 3.5, z + depth/2);
          table.castShadow = true;
          group.add(table);

          // Chairs around table (simplified as small boxes)
          const chairGeo = new THREE.BoxGeometry(4, 5, 4);
          const chairMat = new THREE.MeshLambertMaterial({ color: 0x1f2937 });
          
          const chairPositions = [
            [0.25, 0.3], [0.5, 0.25], [0.75, 0.3],
            [0.25, 0.7], [0.5, 0.75], [0.75, 0.7],
          ];
          
          chairPositions.forEach(([px, pz]) => {
            const chair = new THREE.Mesh(chairGeo, chairMat);
            chair.position.set(x + width * px, 4.5, z + depth * pz);
            chair.castShadow = true;
            group.add(chair);
          });

          // Screen/display at one end
          const screenGeo = new THREE.BoxGeometry(width * 0.4, 12, 1);
          const screenMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
          const screen = new THREE.Mesh(screenGeo, screenMat);
          screen.position.set(x + width/2, 14, z + 3);
          screen.castShadow = true;
          group.add(screen);
        }

        // === STORAGE ROOM FEATURES ===
        const isStorage = roomType?.toLowerCase().includes('storage') || roomType?.toLowerCase().includes('filing');
        if (isStorage && !isCourtroom && !isChamber && !isConference && !isOffice) {
          // Shelving units along walls
          const shelfMat = new THREE.MeshLambertMaterial({ color: 0x78716c });
          
          // Back shelf
          const backShelfGeo = new THREE.BoxGeometry(width * 0.8, 20, 5);
          const backShelf = new THREE.Mesh(backShelfGeo, shelfMat);
          backShelf.position.set(x + width/2, 12, z + 5);
          backShelf.castShadow = true;
          group.add(backShelf);

          // Side shelves
          const sideShelfGeo = new THREE.BoxGeometry(5, 18, depth * 0.6);
          const leftShelf = new THREE.Mesh(sideShelfGeo, shelfMat);
          leftShelf.position.set(x + 5, 11, z + depth/2);
          leftShelf.castShadow = true;
          group.add(leftShelf);

          const rightShelf = new THREE.Mesh(sideShelfGeo, shelfMat);
          rightShelf.position.set(x + width - 5, 11, z + depth/2);
          rightShelf.castShadow = true;
          group.add(rightShelf);

          // Boxes on floor
          const boxMat = new THREE.MeshLambertMaterial({ color: 0xa8a29e });
          for (let i = 0; i < 3; i++) {
            const boxGeo = new THREE.BoxGeometry(8, 6, 8);
            const box = new THREE.Mesh(boxGeo, boxMat);
            box.position.set(x + width * 0.3 + i * 15, 5, z + depth * 0.7);
            box.castShadow = true;
            group.add(box);
          }
        }

        // === JURY ROOM FEATURES ===
        const isJuryRoom = roomType?.toLowerCase().includes('jury');
        if (isJuryRoom && !isCourtroom) {
          // Large deliberation table
          const tableGeo = new THREE.BoxGeometry(width * 0.5, 3, depth * 0.35);
          const tableMat = new THREE.MeshLambertMaterial({ color: 0x5b21b6 });
          const table = new THREE.Mesh(tableGeo, tableMat);
          table.position.set(x + width/2, 3.5, z + depth/2);
          table.castShadow = true;
          group.add(table);

          // Chairs around table
          const chairGeo = new THREE.BoxGeometry(4, 5, 4);
          const chairMat = new THREE.MeshLambertMaterial({ color: 0x4c1d95 });
          
          // 12 juror chairs
          const jurorPositions = [
            [0.2, 0.35], [0.35, 0.3], [0.5, 0.28], [0.65, 0.3], [0.8, 0.35],
            [0.2, 0.65], [0.35, 0.7], [0.5, 0.72], [0.65, 0.7], [0.8, 0.65],
            [0.15, 0.5], [0.85, 0.5],
          ];
          
          jurorPositions.forEach(([px, pz]) => {
            const chair = new THREE.Mesh(chairGeo, chairMat);
            chair.position.set(x + width * px, 4.5, z + depth * pz);
            chair.castShadow = true;
            group.add(chair);
          });

          // Water pitcher on table
          const pitcherGeo = new THREE.CylinderGeometry(2, 2.5, 5, 8);
          const pitcherMat = new THREE.MeshLambertMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.7 });
          const pitcher = new THREE.Mesh(pitcherGeo, pitcherMat);
          pitcher.position.set(x + width/2, 7, z + depth/2);
          group.add(pitcher);
        }

        // === ROOF/CEILING ACCENT ===
        if (isCourtroom || isChamber) {
          // Add a subtle ceiling accent for important rooms
          const ceilingGeo = new THREE.BoxGeometry(width * 0.3, 1, depth * 0.3);
          const ceilingMat = new THREE.MeshLambertMaterial({ color: typeColors.accent, transparent: true, opacity: 0.6 });
          const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
          ceiling.position.set(x + width/2, wallHeight - 1, z + depth/2);
          group.add(ceiling);
        }

        // Label with room type indicator
        if (showLabels) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = 256;
            canvas.height = 80;
            
            // Background for better readability
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.roundRect(10, 5, 236, 70, 8);
            ctx.fill();
            
            // Room name
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 22px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(obj.data?.label || 'Room', 128, 35);
            
            // Room type subtitle
            if (roomType) {
              ctx.fillStyle = '#64748b';
              ctx.font = '14px Inter, system-ui, sans-serif';
              ctx.fillText(roomType.replace(/_/g, ' ').toUpperCase(), 128, 58);
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.set(x + width/2, wallHeight + 20, z + depth/2);
            sprite.scale.set(70, 22, 1);
            group.add(sprite);
          }
        }
      } else if (obj.type === 'hallway') {
        // Hallway: flat corridor
        const hallwayHeight = 3;
        const geo = new THREE.BoxGeometry(width, hallwayHeight, depth);
        const mat = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.7 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x + width/2, hallwayHeight/2, z + depth/2);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);

        if (showLabels) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = 256;
            canvas.height = 64;
            ctx.fillStyle = '#475569';
            ctx.font = '18px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(obj.data?.label || 'Hallway', 128, 40);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.set(x + width/2, 15, z + depth/2);
            sprite.scale.set(50, 12, 1);
            group.add(sprite);
          }
        }
      } else if (obj.type === 'door') {
        // Door: small box
        const doorHeight = 20;
        const geo = new THREE.BoxGeometry(width, doorHeight, depth);
        const mat = new THREE.MeshLambertMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x + width/2, doorHeight/2, z + depth/2);
        mesh.castShadow = true;
        group.add(mesh);
      }

      scene.add(group);
      meshMapRef.current.set(obj.id, group);
    });

    // Update camera to fit the layout
    if (controlsRef.current && cameraRef.current) {
      // Set camera target to center of layout (which is now at origin)
      controlsRef.current.target.set(0, 0, 0);
      
      // Position camera to see all objects
      const maxDimension = Math.max(layoutWidth, layoutDepth, 200);
      const cameraDistance = maxDimension * 1.2;
      
      cameraRef.current.position.set(cameraDistance * 0.7, cameraDistance * 0.6, cameraDistance * 0.7);
      cameraRef.current.lookAt(0, 0, 0);
      cameraRef.current.updateProjectionMatrix();
      
      controlsRef.current.update();
      
      console.log('[3D] Camera positioned at distance:', cameraDistance);
    }
  }, [objects, selectedObjectId, showLabels]);

  // Fit view when triggered
  useEffect(() => {
    if (fitViewTrigger === 0) return;
    
    if (controlsRef.current && cameraRef.current) {
      const { width, depth } = layoutBoundsRef.current;
      const maxDimension = Math.max(width, depth, 200);
      const cameraDistance = maxDimension * 1.2;
      
      // Animate camera to fit view
      cameraRef.current.position.set(cameraDistance * 0.7, cameraDistance * 0.6, cameraDistance * 0.7);
      cameraRef.current.lookAt(0, 0, 0);
      cameraRef.current.updateProjectionMatrix();
      
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      
      console.log('[3D] Fit view triggered, camera distance:', cameraDistance);
    }
  }, [fitViewTrigger]);

  // Handle click
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    const meshes: THREE.Object3D[] = [];
    meshMapRef.current.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        }
      });
    });

    const intersects = raycasterRef.current.intersectObjects(meshes, false);
    
    if (intersects.length > 0) {
      let parent = intersects[0].object.parent;
      while (parent && !parent.userData?.id) {
        parent = parent.parent;
      }
      if (parent?.userData?.id) {
        onObjectSelect(parent.userData.id);
        return;
      }
    }
    
    onObjectSelect(null);
  }, [onObjectSelect]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onClick={handleClick}
    />
  );
}

export default FloorPlan3DCanvas;
