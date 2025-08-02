import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface RoomData {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  type: string;
  rotation?: number;
}

export interface ConnectionData {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export interface Scene3DOptions {
  enableShadows?: boolean;
  backgroundColor?: number;
  gridSize?: number;
  cameraDistance?: number;
}

export class Scene3DManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement | null = null;
  private animationId: number | null = null;
  
  // Object pools for reuse
  private roomMeshes: Map<string, THREE.Group> = new Map();
  private connectionMeshes: Map<string, THREE.Group> = new Map();
  
  // Materials (reused)
  private roomMaterial: THREE.MeshPhongMaterial;
  private selectedMaterial: THREE.MeshPhongMaterial;
  private hoveredMaterial: THREE.MeshPhongMaterial;
  private connectionMaterial: THREE.LineBasicMaterial;
  
  // Interaction state
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedRoomId: string | null = null;
  private hoveredRoomId: string | null = null;
  
  // Event callbacks
  private onRoomClick?: (roomId: string, roomData: RoomData) => void;
  private onRoomHover?: (roomId: string | null, roomData?: RoomData) => void;
  private roomDataMap: Map<string, RoomData> = new Map();
  
  private isInitialized = false;
  private options: Scene3DOptions;

  constructor(options: Scene3DOptions = {}) {
    this.options = {
      enableShadows: true,
      backgroundColor: 0xf5f5f5,
      gridSize: 1000,
      cameraDistance: 500,
      ...options
    };

    // Initialize Three.js components
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000);
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });

    // Initialize interaction components
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Initialize enhanced materials
    this.roomMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xe2e8f0,
      specular: 0x111111,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });
    this.selectedMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x3b82f6,
      emissive: 0x1e40af,
      emissiveIntensity: 0.3,
      specular: 0x4444ff,
      shininess: 100
    });
    this.hoveredMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x60a5fa,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.2,
      specular: 0x4444ff,
      shininess: 100
    });
    this.connectionMaterial = new THREE.LineBasicMaterial({ 
      color: 0x64748b,
      linewidth: 2
    });

    this.setupScene();
  }

  private setupScene(): void {
    try {
      // Set background to a more professional color
      this.scene.background = new THREE.Color(0xf8fafc);

      // Enhanced lighting setup with dynamic lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambientLight);

      // Main directional light with enhanced shadows
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(400, 500, 400);
      directionalLight.castShadow = this.options.enableShadows;
      if (this.options.enableShadows) {
        directionalLight.shadow.mapSize.width = 4096;
        directionalLight.shadow.mapSize.height = 4096;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 1500;
        directionalLight.shadow.camera.left = -800;
        directionalLight.shadow.camera.right = 800;
        directionalLight.shadow.camera.top = 800;
        directionalLight.shadow.camera.bottom = -800;
        directionalLight.shadow.bias = -0.0001;
        directionalLight.shadow.normalBias = 0.02;
      }
      this.scene.add(directionalLight);

      // Secondary fill light for better illumination
      const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.4);
      fillLight.position.set(-400, 300, -400);
      this.scene.add(fillLight);

      // Hemisphere light for natural lighting
      const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0xf4f1de, 0.6);
      this.scene.add(hemisphereLight);

      // Warm accent light for depth
      const accentLight = new THREE.PointLight(0xfbbf24, 0.3, 600);
      accentLight.position.set(0, 250, 0);
      this.scene.add(accentLight);

      // Rim lighting for better object definition
      const rimLight = new THREE.SpotLight(0x60a5fa, 0.5, 800, Math.PI / 6, 0.5, 2);
      rimLight.position.set(200, 400, -200);
      rimLight.target.position.set(0, 0, 0);
      this.scene.add(rimLight);
      this.scene.add(rimLight.target);

      // Enhanced grid with better styling
      const gridHelper = new THREE.GridHelper(
        this.options.gridSize!, 
        100, 
        0x94a3b8, 
        0xe2e8f0
      );
      gridHelper.position.y = -1;
      this.scene.add(gridHelper);

      // Add a ground plane for better shadows
      if (this.options.enableShadows) {
        const groundGeometry = new THREE.PlaneGeometry(this.options.gridSize!, this.options.gridSize!);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
          color: 0xffffff, 
          transparent: true, 
          opacity: 0.1 
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        this.scene.add(ground);
      }

      // Setup renderer
      this.renderer.setSize(800, 600); // Default size, will be updated
      if (this.options.enableShadows) {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }

      // Setup camera with better initial position
      this.camera.position.set(300, 250, 300);
      this.camera.lookAt(0, 0, 0);
      this.camera.updateProjectionMatrix();

    } catch (error) {
      console.error('Scene3DManager: Error setting up scene:', error);
      throw new Error('Failed to initialize 3D scene');
    }
  }

  public mount(container: HTMLElement): void {
    if (this.isInitialized) {
      console.warn('Scene3DManager: Already initialized, skipping mount');
      return;
    }

    if (!container) {
      throw new Error('Scene3DManager: Container element is required');
    }

    // Clear any existing canvas elements to prevent WebGL context conflicts
    const existingCanvases = container.querySelectorAll('canvas');
    existingCanvases.forEach(canvas => {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    });

    this.container = container;

    try {
      // Setup renderer with proper context handling
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      if (this.options.enableShadows) {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
      
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;

      // Setup camera
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.position.set(
        this.options.cameraDistance!, 
        this.options.cameraDistance! * 0.8, 
        this.options.cameraDistance!
      );
      this.camera.updateProjectionMatrix();

      // Setup controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2.2; // Allow slight overhead view
      this.controls.minDistance = 50;
      this.controls.maxDistance = 1000;
      this.controls.enablePan = true;
      this.controls.panSpeed = 1.0;
      this.controls.rotateSpeed = 0.5;
      this.controls.zoomSpeed = 1.0;
      this.controls.autoRotate = false;
      this.controls.target.set(0, 0, 0);

      // Add renderer to container
      container.appendChild(this.renderer.domElement);

      // Setup mouse interaction
      this.setupMouseInteraction();

      // Handle resize
      this.handleResize();
      window.addEventListener('resize', this.handleResize);

      // Start render loop
      this.startRenderLoop();

      this.isInitialized = true;
      console.log('Scene3DManager: Successfully mounted');

    } catch (error) {
      console.error('Scene3DManager: Error mounting:', error);
      throw new Error('Failed to mount 3D scene');
    }
  }

  public unmount(): void {
    try {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }

      window.removeEventListener('resize', this.handleResize);

      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }

      // Properly dispose of Three.js resources
      this.controls?.dispose();
      
      // Dispose of materials
      this.roomMaterial?.dispose();
      this.selectedMaterial?.dispose();
      this.hoveredMaterial?.dispose();
      this.connectionMaterial?.dispose();
      
      // Dispose of geometries and meshes
      this.roomMeshes.forEach(mesh => {
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material?.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      });
      
      this.connectionMeshes.forEach(mesh => {
        mesh.traverse((child) => {
          if (child instanceof THREE.Line) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material?.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      });
      
      // Clear maps
      this.roomMeshes.clear();
      this.connectionMeshes.clear();
      this.roomDataMap.clear();
      
      // Dispose of renderer and WebGL context
      this.renderer.dispose();
      
      this.isInitialized = false;

      console.log('Scene3DManager: Successfully unmounted with proper cleanup');

    } catch (error) {
      console.error('Scene3DManager: Error unmounting:', error);
    }
  }

  private handleResize = (): void => {
    if (!this.container) return;

    try {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);

    } catch (error) {
      console.error('Scene3DManager: Error handling resize:', error);
    }
  };

  private startRenderLoop(): void {
    const render = () => {
      try {
        this.controls?.update();
        this.renderer.render(this.scene, this.camera);
        this.animationId = requestAnimationFrame(render);
      } catch (error) {
        console.error('Scene3DManager: Error in render loop:', error);
        // Stop the render loop on error to prevent infinite error spam
        if (this.animationId) {
          cancelAnimationFrame(this.animationId);
          this.animationId = null;
        }
      }
    };
    render();
  }

  // Event callback setters
  public setRoomClickCallback(callback: (roomId: string, roomData: RoomData) => void): void {
    this.onRoomClick = callback;
  }

  public setRoomHoverCallback(callback: (roomId: string | null, roomData?: RoomData) => void): void {
    this.onRoomHover = callback;
  }

  private setupMouseInteraction(): void {
    if (!this.container) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.handleMouseHover();
    };

    const handleMouseClick = (event: MouseEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.handleMouseClick();
    };

    this.renderer.domElement.addEventListener('mousemove', handleMouseMove);
    this.renderer.domElement.addEventListener('click', handleMouseClick);
    this.renderer.domElement.style.cursor = 'pointer';
  }

  private handleMouseHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    let hoveredRoom: string | null = null;

    for (const intersect of intersects) {
      const object = intersect.object;
      let parent = object.parent;
      
      // Find the room group
      while (parent && parent.userData.type !== 'room') {
        parent = parent.parent;
      }
      
      if (parent && parent.userData.id) {
        hoveredRoom = parent.userData.id;
        break;
      }
    }

    if (hoveredRoom !== this.hoveredRoomId) {
      // Clear previous hover
      if (this.hoveredRoomId) {
        this.setRoomHover(null);
      }
      
      // Set new hover
      if (hoveredRoom) {
        this.setRoomHover(hoveredRoom);
        this.renderer.domElement.style.cursor = 'pointer';
      } else {
        this.renderer.domElement.style.cursor = 'default';
      }
      
      this.hoveredRoomId = hoveredRoom;
      
      // Call hover callback
      if (this.onRoomHover) {
        const roomData = hoveredRoom ? this.roomDataMap.get(hoveredRoom) : undefined;
        this.onRoomHover(hoveredRoom, roomData);
      }
    }
  }

  private handleMouseClick(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const intersect of intersects) {
      const object = intersect.object;
      let parent = object.parent;
      
      // Find the room group
      while (parent && parent.userData.type !== 'room') {
        parent = parent.parent;
      }
      
      if (parent && parent.userData.id) {
        const roomId = parent.userData.id;
        const roomData = this.roomDataMap.get(roomId);
        
        // Update selection
        this.setRoomSelection(roomId === this.selectedRoomId ? null : roomId);
        
        // Call click callback
        if (this.onRoomClick && roomData) {
          this.onRoomClick(roomId, roomData);
        }
        break;
      }
    }
  }

  public updateRooms(rooms: RoomData[]): void {
    try {
      // Validate input data
      const validRooms = this.validateRoomData(rooms);

      // Clear existing rooms and data
      this.clearRooms();
      this.roomDataMap.clear();

      // Create new room meshes and store data
      validRooms.forEach(room => {
        const roomGroup = this.createRoomMesh(room);
        if (roomGroup) {
          this.scene.add(roomGroup);
          this.roomMeshes.set(room.id, roomGroup);
          this.roomDataMap.set(room.id, room);
        }
      });

      console.log(`Scene3DManager: Updated ${validRooms.length} rooms`);

    } catch (error) {
      console.error('Scene3DManager: Error updating rooms:', error);
    }
  }

  public updateConnections(connections: ConnectionData[]): void {
    try {
      // Validate input data
      const validConnections = this.validateConnectionData(connections);

      // Clear existing connections
      this.clearConnections();

      // Create new connection meshes
      validConnections.forEach(connection => {
        const connectionLine = this.createConnectionMesh(connection);
        if (connectionLine) {
          this.scene.add(connectionLine);
          this.connectionMeshes.set(connection.id, connectionLine);
        }
      });

      console.log(`Scene3DManager: Updated ${validConnections.length} connections`);

    } catch (error) {
      console.error('Scene3DManager: Error updating connections:', error);
    }
  }

  private validateRoomData(rooms: RoomData[]): RoomData[] {
    return rooms.filter(room => {
      if (!room || typeof room !== 'object') return false;
      if (!room.id || typeof room.id !== 'string') return false;
      if (!room.position || typeof room.position.x !== 'number' || typeof room.position.y !== 'number') return false;
      if (!room.size || typeof room.size.width !== 'number' || typeof room.size.height !== 'number') return false;
      if (room.size.width <= 0 || room.size.height <= 0) return false;
      return true;
    });
  }

  private validateConnectionData(connections: ConnectionData[]): ConnectionData[] {
    return connections.filter(connection => {
      if (!connection || typeof connection !== 'object') return false;
      if (!connection.id || typeof connection.id !== 'string') return false;
      if (!connection.from || typeof connection.from.x !== 'number' || typeof connection.from.y !== 'number') return false;
      if (!connection.to || typeof connection.to.x !== 'number' || typeof connection.to.y !== 'number') return false;
      return true;
    });
  }

  private createRoomMesh(room: RoomData): THREE.Group | null {
    try {
      const group = new THREE.Group();
      group.userData = { id: room.id, type: room.type || 'room' };

      // Handle different room types
      if (room.type === 'hallway') {
        return this.createHallwayMesh(room, group);
      } else {
        return this.createStandardRoomMesh(room, group);
      }

    } catch (error) {
      console.error(`Scene3DManager: Error creating room mesh for ${room.id}:`, error);
      return null;
    }
  }

  private createStandardRoomMesh(room: RoomData, group: THREE.Group): THREE.Group {
    const wallHeight = 40;
    const wallThickness = 2;
    const floorHeight = 1;
    const gridSize = 20; // Grid snap size

    // Snap positions to grid for better alignment
    const snappedX = Math.round(room.position.x / gridSize) * gridSize;
    const snappedY = Math.round(room.position.y / gridSize) * gridSize;
    const snappedWidth = Math.max(gridSize, Math.round(room.size.width / gridSize) * gridSize);
    const snappedHeight = Math.max(gridSize, Math.round(room.size.height / gridSize) * gridSize);

    // Create floor with enhanced PBR material based on room type
    const floorGeometry = new THREE.BoxGeometry(snappedWidth, floorHeight, snappedHeight);
    const roomTypeColors = {
      'office': 0xf1f5f9,
      'courtroom': 0xdbeafe,
      'conference': 0xfef3c7,
      'storage': 0xe5e7eb,
      'hallway': 0xe2e8f0,
      'default': 0xf8fafc
    };
    
    const floorColor = roomTypeColors[room.type as keyof typeof roomTypeColors] || roomTypeColors.default;
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: floorColor,
      metalness: 0.1,
      roughness: 0.8,
      transparent: true,
      opacity: 0.95,
      envMapIntensity: 0.5
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(snappedX, floorHeight / 2, snappedY);
    
    if (this.options.enableShadows) {
      floor.castShadow = true;
      floor.receiveShadow = true;
    }
    group.add(floor);

    // Create walls with enhanced PBR materials and grid-aligned positioning
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.05,
      roughness: 0.9,
      transparent: true,
      opacity: 0.9,
      envMapIntensity: 0.3
    });
    
    // Front and back walls (using snapped dimensions)
    const frontBackWallGeometry = new THREE.BoxGeometry(snappedWidth, wallHeight, wallThickness);
    
    const frontWall = new THREE.Mesh(frontBackWallGeometry, wallMaterial.clone());
    frontWall.position.set(
      snappedX, 
      wallHeight / 2 + floorHeight, 
      snappedY + snappedHeight / 2 - wallThickness / 2
    );
    
    const backWall = new THREE.Mesh(frontBackWallGeometry, wallMaterial.clone());
    backWall.position.set(
      snappedX, 
      wallHeight / 2 + floorHeight, 
      snappedY - snappedHeight / 2 + wallThickness / 2
    );

    // Left and right walls (using snapped dimensions)
    const leftRightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, snappedHeight);
    
    const leftWall = new THREE.Mesh(leftRightWallGeometry, wallMaterial.clone());
    leftWall.position.set(
      snappedX - snappedWidth / 2 + wallThickness / 2, 
      wallHeight / 2 + floorHeight, 
      snappedY
    );
    
    const rightWall = new THREE.Mesh(leftRightWallGeometry, wallMaterial.clone());
    rightWall.position.set(
      snappedX + snappedWidth / 2 - wallThickness / 2, 
      wallHeight / 2 + floorHeight, 
      snappedY
    );

    // Apply rotation to entire group if specified
    if (room.rotation) {
      group.rotation.y = (room.rotation * Math.PI) / 180;
    }

    // Enable shadows for all walls
    if (this.options.enableShadows) {
      [frontWall, backWall, leftWall, rightWall].forEach(wall => {
        wall.castShadow = true;
        wall.receiveShadow = true;
      });
    }

    group.add(frontWall, backWall, leftWall, rightWall);

    // Add room label with better positioning
    if (room.name) {
      this.addRoomLabel(group, room.name, snappedX, wallHeight + 8, snappedY);
    }

    // Add room status indicator
    const statusColors = {
      'active': 0x10b981,
      'maintenance': 0xf59e0b,
      'inactive': 0xef4444,
      'default': 0x6b7280
    };
    
    // Add status indicator sphere
    const statusGeometry = new THREE.SphereGeometry(8, 16, 16);
    const statusColor = statusColors['active'] || statusColors.default; // Default to active
    const statusMaterial = new THREE.MeshStandardMaterial({
      color: statusColor,
      emissive: statusColor,
      emissiveIntensity: 0.3,
      metalness: 0.2,
      roughness: 0.3
    });
    const statusIndicator = new THREE.Mesh(statusGeometry, statusMaterial);
    statusIndicator.position.set(snappedX + snappedWidth/2 - 15, wallHeight + 15, snappedY - snappedHeight/2 + 15);
    
    if (this.options.enableShadows) {
      statusIndicator.castShadow = true;
    }
    group.add(statusIndicator);
    
    // Add room type badge
    if (room.type && room.type !== 'room') {
      const badgeGeometry = new THREE.BoxGeometry(40, 8, 20);
      const badgeMaterial = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        metalness: 0.1,
        roughness: 0.7
      });
      const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
      badge.position.set(snappedX, wallHeight + 25, snappedY + snappedHeight/2 - 10);
      
      if (this.options.enableShadows) {
        badge.castShadow = true;
      }
      group.add(badge);
    }

    // Store snapped position for better interaction
    group.userData.snappedPosition = { x: snappedX, y: snappedY };
    group.userData.snappedSize = { width: snappedWidth, height: snappedHeight };
    group.userData.roomType = room.type;
    group.userData.statusColor = statusColor;

    return group;
  }

  private createHallwayMesh(room: RoomData, group: THREE.Group): THREE.Group {
    const floorHeight = 1;
    const wallHeight = 25; // Lower walls for hallways
    const wallThickness = 1;

    // Create hallway floor with different color
    const floorGeometry = new THREE.BoxGeometry(room.size.width, floorHeight, room.size.height);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xe2e8f0, // Lighter gray for hallways
      specular: 0x111111,
      shininess: 30
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(room.position.x, floorHeight / 2, room.position.y);
    
    if (this.options.enableShadows) {
      floor.castShadow = true;
      floor.receiveShadow = true;
    }
    group.add(floor);

    // Create low side walls for hallways (no front/back walls for open passage)
    const wallMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xd1d5db,
      specular: 0x111111,
      shininess: 20
    });
    
    // Left and right walls only
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, room.size.height);
    
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial.clone());
    leftWall.position.set(
      room.position.x - room.size.width / 2 + wallThickness / 2, 
      wallHeight / 2 + floorHeight, 
      room.position.y
    );
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial.clone());
    rightWall.position.set(
      room.position.x + room.size.width / 2 - wallThickness / 2, 
      wallHeight / 2 + floorHeight, 
      room.position.y
    );

    // Enable shadows for walls
    if (this.options.enableShadows) {
      [leftWall, rightWall].forEach(wall => {
        wall.castShadow = true;
        wall.receiveShadow = true;
      });
    }

    group.add(leftWall, rightWall);

    // Add hallway label at lower height
    if (room.name) {
      this.addRoomLabel(group, room.name, room.position.x, wallHeight + 3, room.position.y);
    }

    return group;
  }

  private addRoomLabel(group: THREE.Group, text: string, x: number, y: number, z: number): void {
    try {
      // Create a high-resolution canvas for better text quality
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      const scale = 2; // Higher resolution
      canvas.width = 512 * scale;
      canvas.height = 128 * scale;
      context.scale(scale, scale);
      
      // Create rounded rectangle background
      const padding = 16;
      const borderRadius = 8;
      const rectWidth = canvas.width / scale - padding * 2;
      const rectHeight = canvas.height / scale - padding * 2;
      
      // Background with rounded corners
      context.fillStyle = 'rgba(255, 255, 255, 0.95)';
      context.beginPath();
      context.roundRect(padding, padding, rectWidth, rectHeight, borderRadius);
      context.fill();
      
      // Border
      context.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      context.lineWidth = 2;
      context.stroke();
      
      // Text styling
      context.fillStyle = '#1f2937';
      context.font = 'bold 32px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      // Add text shadow for better readability
      context.shadowColor = 'rgba(0, 0, 0, 0.1)';
      context.shadowBlur = 2;
      context.shadowOffsetX = 1;
      context.shadowOffsetY = 1;
      
      // Truncate text if too long
      let displayText = text;
      const maxWidth = rectWidth - padding * 2;
      if (context.measureText(text).width > maxWidth) {
        while (context.measureText(displayText + '...').width > maxWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '...';
      }
      
      context.fillText(displayText, canvas.width / (2 * scale), canvas.height / (2 * scale));
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        alphaTest: 0.1
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      
      // Position above the room with better scaling
      sprite.position.set(x, y, z);
      sprite.scale.set(40, 10, 1); // Larger, more readable size
      sprite.userData = { type: 'label', roomId: group.userData.id };
      
      group.add(sprite);
    } catch (error) {
      console.error('Error creating room label:', error);
    }
  }

  private createConnectionMesh(connection: ConnectionData): THREE.Group | null {
    try {
      const group = new THREE.Group();
      group.userData = { id: connection.id, type: 'connection' };

      const connectionHeight = 20;
      
      // Create main connection line
      const points = [
        new THREE.Vector3(connection.from.x, connectionHeight, connection.from.y),
        new THREE.Vector3(connection.to.x, connectionHeight, connection.to.y)
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x059669,
        linewidth: 3,
        transparent: true,
        opacity: 0.8
      });
      const line = new THREE.Line(geometry, lineMaterial);
      group.add(line);

      // Add connection indicators (small spheres at endpoints)
      const sphereGeometry = new THREE.SphereGeometry(2, 8, 6);
      const sphereMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x10b981,
        emissive: 0x065f46,
        emissiveIntensity: 0.2
      });
      
      const startSphere = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());
      startSphere.position.set(connection.from.x, connectionHeight, connection.from.y);
      
      const endSphere = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());
      endSphere.position.set(connection.to.x, connectionHeight, connection.to.y);
      
      if (this.options.enableShadows) {
        startSphere.castShadow = true;
        endSphere.castShadow = true;
      }
      
      group.add(startSphere, endSphere);

      return group;

    } catch (error) {
      console.error(`Scene3DManager: Error creating connection mesh for ${connection.id}:`, error);
      return null;
    }
  }

  private clearRooms(): void {
    this.roomMeshes.forEach((group, id) => {
      this.scene.remove(group);
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.roomMeshes.clear();
  }

  private clearConnections(): void {
    this.connectionMeshes.forEach((connectionGroup, id) => {
      if (connectionGroup) {
        this.scene.remove(connectionGroup);
        
        // Dispose of all meshes in the group
        connectionGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(material => material.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
    });
    this.connectionMeshes.clear();
  }

  public setRoomSelection(roomId: string | null): void {
    try {
      this.roomMeshes.forEach((group, id) => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (id === roomId) {
              child.material = this.selectedMaterial;
            } else {
              child.material = this.roomMaterial;
            }
          }
        });
      });
    } catch (error) {
      console.error('Scene3DManager: Error setting room selection:', error);
    }
  }

  public setRoomHover(roomId: string | null): void {
    try {
      this.roomMeshes.forEach((group, id) => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (id === roomId) {
              child.material = this.hoveredMaterial;
            } else {
              child.material = this.roomMaterial;
            }
          }
        });
      });
    } catch (error) {
      console.error('Scene3DManager: Error setting room hover:', error);
    }
  }

  public dispose(): void {
    try {
      this.unmount();
      
      // Dispose of materials
      this.roomMaterial.dispose();
      this.selectedMaterial.dispose();
      this.hoveredMaterial.dispose();
      this.connectionMaterial.dispose();

      // Dispose of renderer
      this.renderer.dispose();

      console.log('Scene3DManager: Disposed successfully');

    } catch (error) {
      console.error('Scene3DManager: Error disposing:', error);
    }
  }
}
