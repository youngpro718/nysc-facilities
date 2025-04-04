import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { useFrame, useThree } from '@react-three/fiber';
import { useFloorPlanData } from '../hooks/useFloorPlanData';
import { useSnapshot } from 'valtio';
import { floorPlanState } from '../states/floorPlanState';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ThreeDSceneProps {
  floorId: string | null;
}

const ThreeDScene: React.FC<ThreeDSceneProps> = ({ floorId }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const state = useSnapshot(floorPlanState);
  const { objects, isLoading, layers } = useFloorPlanData(floorId);
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
  const [lightingFixtures, setLightingFixtures] = useState<any[]>([]);

  // Fetch lighting fixtures data
  const { data: fixturesData, isLoading: isLoadingFixtures } = useQuery({
    queryKey: ['lighting-fixtures', floorId],
    queryFn: async () => {
      if (!floorId) return [];

      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('*')
        .eq('floor_id', floorId);

      if (error) {
        console.error('Error fetching lighting fixtures:', error);
        throw error;
      }

      return data || [];
    },
  });

  useEffect(() => {
    if (fixturesData) {
      setLightingFixtures(fixturesData);
    }
  }, [fixturesData]);

  useEffect(() => {
    if (isLoading || !mountRef.current) return;

    const { clientWidth: width, clientHeight: height } = mountRef.current;

    // Scene, camera, and renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#ffffff');
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 150, 300);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // OrbitControls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 50, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // GridHelper
    const gridHelper = new THREE.GridHelper(1000, 20, 'gray', 'lightgray');
    scene.add(gridHelper);

    // Load models and create objects
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    gltfLoader.setDRACOLoader(dracoLoader);

    const textureLoader = new THREE.TextureLoader();

    // Load room texture
    const roomTexture = textureLoader.load('/textures/light-wood.jpg', () => {
      roomTexture.wrapS = THREE.RepeatWrapping;
      roomTexture.wrapT = THREE.RepeatWrapping;
      roomTexture.repeat.set(4, 4);
    });

    // Load hallway texture
    const hallwayTexture = textureLoader.load('/textures/carpet-texture.jpg', () => {
      hallwayTexture.wrapS = THREE.RepeatWrapping;
      hallwayTexture.wrapT = THREE.RepeatWrapping;
      hallwayTexture.repeat.set(4, 1);
    });

    // Load door model
    let doorModel: THREE.Group | null = null;
    gltfLoader.load('/models/door/scene.gltf', (gltf) => {
      doorModel = gltf.scene;
      doorModel.scale.set(10, 10, 10);
      doorModel.rotation.y = Math.PI / 2;
      doorModel.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
        }
      });
    }, undefined, (error) => {
      console.error('Error loading door model', error);
    });

    // Load lighting fixture model
    let lightingFixtureModel: THREE.Group | null = null;
    gltfLoader.load('/models/lighting_fixture/scene.gltf', (gltf) => {
      lightingFixtureModel = gltf.scene;
      lightingFixtureModel.scale.set(0.5, 0.5, 0.5);
      lightingFixtureModel.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
        }
      });
    }, undefined, (error) => {
      console.error('Error loading lighting fixture model', error);
    });

    // Function to create room mesh
    const createRoomMesh = (room: any) => {
      const roomSize = room.size || { width: 150, height: 100 };
      const roomGeometry = new THREE.BoxGeometry(roomSize.width, 100, roomSize.height);
      const roomMaterial = new THREE.MeshLambertMaterial({ map: roomTexture });
      const roomMesh = new THREE.Mesh(roomGeometry, roomMaterial);
      roomMesh.position.set(room.position.x, 50, room.position.y);
      roomMesh.rotation.y = room.rotation * Math.PI / 180;
      roomMesh.name = room.name;
      roomMesh.userData.roomId = room.id.toString();
      roomMesh.addEventListener('click', (event: any) => {
        setSelectedObject(event.target);
      });

      // Create room label
      const roomLabelGeometry = new THREE.PlaneGeometry(roomSize.width / 2, roomSize.height / 4);
      const roomLabelMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const roomLabel = new THREE.Mesh(roomLabelGeometry, roomLabelMaterial);
      roomLabel.position.set(0, 100, 0);
      roomLabel.name = 'label';
      roomLabel.userData.roomId = room.id.toString();
      roomMesh.add(roomLabel);

      // Create room label text
      const roomLabelText = document.createElement('canvas');
      roomLabelText.width = 256;
      roomLabelText.height = 64;
      const roomLabelContext = roomLabelText.getContext('2d');
      roomLabelContext!.font = 'Bold 30px Arial';
      roomLabelContext!.fillStyle = 'rgba(0, 0, 0, 1)';
      roomLabelContext!.fillText(room.name, 10, 40);

      const roomLabelTexture = new THREE.CanvasTexture(roomLabelText);
      const roomLabelMaterialText = new THREE.MeshBasicMaterial({
        map: roomLabelTexture,
        transparent: true,
        side: THREE.DoubleSide
      });
      const roomLabelGeometryText = new THREE.PlaneGeometry(roomSize.width / 2, roomSize.height / 4);
      const roomLabelMeshText = new THREE.Mesh(roomLabelGeometryText, roomLabelMaterialText);
      roomLabelMeshText.position.set(0, 0, 1);
      roomLabel.add(roomLabelMeshText);

      return roomMesh;
    };

    // Function to create hallway mesh
    const createHallwayMesh = (hallway: any) => {
      const hallwaySize = hallway.size || { width: 300, height: 50 };
      const hallwayGeometry = new THREE.BoxGeometry(hallwaySize.width, 50, hallwaySize.height);
      const hallwayMaterial = new THREE.MeshLambertMaterial({ map: hallwayTexture });
      const hallwayMesh = new THREE.Mesh(hallwayGeometry, hallwayMaterial);
      hallwayMesh.position.set(hallway.position.x, 25, hallway.position.y);
      hallwayMesh.rotation.y = hallway.rotation * Math.PI / 180;
      hallwayMesh.name = hallway.name;
      hallwayMesh.userData.hallwayId = hallway.id.toString();
      hallwayMesh.addEventListener('click', (event: any) => {
        setSelectedObject(event.target);
      });

      // Create hallway label
      const hallwayLabelGeometry = new THREE.PlaneGeometry(hallwaySize.width / 2, hallwaySize.height / 4);
      const hallwayLabelMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const hallwayLabel = new THREE.Mesh(hallwayLabelGeometry, hallwayLabelMaterial);
      hallwayLabel.position.set(0, 50, 0);
      hallwayLabel.name = 'label';
      hallwayLabel.userData.hallwayId = hallway.id.toString();
      hallwayMesh.add(hallwayLabel);

      // Create hallway label text
      const hallwayLabelText = document.createElement('canvas');
      hallwayLabelText.width = 256;
      hallwayLabelText.height = 64;
      const hallwayLabelContext = hallwayLabelText.getContext('2d');
      hallwayLabelContext!.font = 'Bold 30px Arial';
      hallwayLabelContext!.fillStyle = 'rgba(0, 0, 0, 1)';
      hallwayLabelContext!.fillText(hallway.name, 10, 40);

      const hallwayLabelTexture = new THREE.CanvasTexture(hallwayLabelText);
      const hallwayLabelMaterialText = new THREE.MeshBasicMaterial({
        map: hallwayLabelTexture,
        transparent: true,
        side: THREE.DoubleSide
      });
      const hallwayLabelGeometryText = new THREE.PlaneGeometry(hallwaySize.width / 2, hallwaySize.height / 4);
      const hallwayLabelMeshText = new THREE.Mesh(hallwayLabelGeometryText, hallwayLabelMaterialText);
      hallwayLabelMeshText.position.set(0, 0, 1);
      hallwayLabel.add(hallwayLabelMeshText);

      return hallwayMesh;
    };

    // Function to create door mesh
    const createDoorMesh = (door: any) => {
      if (!doorModel) return null;

      const doorMesh = doorModel.clone();
      doorMesh.position.set(door.position.x, 0, door.position.y);
      doorMesh.scale.set(10, 10, 10);
      doorMesh.rotation.y = door.rotation * Math.PI / 180;
      doorMesh.name = door.name;
      doorMesh.userData.doorId = door.id.toString();
      doorMesh.addEventListener('click', (event: any) => {
        setSelectedObject(event.target);
      });

      // Create door label
      const doorLabelGeometry = new THREE.PlaneGeometry(50, 20);
      const doorLabelMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const doorLabel = new THREE.Mesh(doorLabelGeometry, doorLabelMaterial);
      doorLabel.position.set(0, 75, 0);
      doorLabel.name = 'label';
      doorLabel.userData.doorId = door.id.toString();
      doorMesh.add(doorLabel);

      // Create door label text
      const doorLabelText = document.createElement('canvas');
      doorLabelText.width = 256;
      doorLabelText.height = 64;
      const doorLabelContext = doorLabelText.getContext('2d');
      doorLabelContext!.font = 'Bold 30px Arial';
      doorLabelContext!.fillStyle = 'rgba(0, 0, 0, 1)';
      doorLabelContext!.fillText(door.name, 10, 40);

      const doorLabelTexture = new THREE.CanvasTexture(doorLabelText);
      const doorLabelMaterialText = new THREE.MeshBasicMaterial({
        map: doorLabelTexture,
        transparent: true,
        side: THREE.DoubleSide
      });
      const doorLabelGeometryText = new THREE.PlaneGeometry(50, 20);
      const doorLabelMeshText = new THREE.Mesh(doorLabelGeometryText, doorLabelMaterialText);
      doorLabelMeshText.position.set(0, 0, 1);
      doorLabel.add(doorLabelMeshText);

      return doorMesh;
    };

    // Function to create lighting fixture mesh
    const createLightingFixtureMesh = (fixture: any) => {
      if (!lightingFixtureModel) return null;

      const lightingFixtureMesh = lightingFixtureModel.clone();
      lightingFixtureMesh.position.set(fixture.position.x, fixture.position.y, 50);
      lightingFixtureMesh.name = fixture.name;
      lightingFixtureMesh.userData.fixtureId = fixture.id;
      lightingFixtureMesh.addEventListener('click', (event: any) => {
        setSelectedObject(event.target);
      });

      return lightingFixtureMesh;
    };

    // Add objects to the scene
    objects.forEach((object: any) => {
      if (object.type === 'room') {
        const roomMesh = createRoomMesh(object);
        scene.add(roomMesh);
      } else if (object.type === 'hallway') {
        const hallwayMesh = createHallwayMesh(object);
        scene.add(hallwayMesh);
      } else if (object.type === 'door') {
        const doorMesh = createDoorMesh(object);
        if (doorMesh) scene.add(doorMesh);
      }
    });

    // Add lighting fixtures to the scene
    lightingFixtures.forEach((fixture: any) => {
      const lightingFixtureMesh = createLightingFixtureMesh(fixture);
      if (lightingFixtureMesh) scene.add(lightingFixtureMesh);
    });

    // Animation loop
    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const { clientWidth: newWidth, clientHeight: newHeight } = mountRef.current;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    setIsLoaded(true);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current!.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [floorId, objects, isLoading, lightingFixtures]);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '600px' }}>
      {!isLoaded && <p>Loading 3D scene...</p>}
    </div>
  );
};

export default ThreeDScene;
