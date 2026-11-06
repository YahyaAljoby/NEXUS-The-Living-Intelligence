import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SimulationEngine, WORLD_BOUNDS } from '../simulation/engine';
import { EntityState, FactionId, StructureNode, AnomalyInstance } from '../types/simulation';
import { FACTION_DEFINITIONS } from '../simulation/factions';

export interface SceneManagerOptions {
  container: HTMLDivElement;
  engine: SimulationEngine;
  onSelectEntity?: (entity: EntityState | null) => void;
  onSelectStructure?: (structure: StructureNode | null) => void;
  onWorldClick?: (x: number, z: number) => void;
}

// Reusable scratch objects to enforce zero GC in render loop
const _vec3 = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _matrix = new THREE.Matrix4();
const _color = new THREE.Color();
const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();

export class SceneManager {
  private container: HTMLDivElement;
  private engine: SimulationEngine;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl = false;
  private animFrameId = 0;
  private isDisposed = false;

  // Camera navigation & damping
  public targetCameraPos = new THREE.Vector3(0, 75, 110);
  public currentCameraPos = new THREE.Vector3(0, 110, 150);
  public targetLookAt = new THREE.Vector3(0, 0, 0);
  public currentLookAt = new THREE.Vector3(0, 0, 0);
  public isCinematicTour = true;
  public selectedEntityId: string | null = null;
  public selectedStructureId: string | null = null;

  // Interactivity
  private isDragging = false;
  private isRightDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  public onSelectEntity?: (entity: EntityState | null) => void;
  public onSelectStructure?: (structure: StructureNode | null) => void;
  public onWorldClick?: (x: number, z: number) => void;

  // 3D Objects
  private entityInstancedMesh!: THREE.InstancedMesh;
  private maxEntityInstances = 1200;
  private structureMeshes: Map<string, THREE.Group> = new Map();
  private anomalyMeshes: Map<string, THREE.Group> = new Map();
  private synapticLinesMesh!: THREE.LineSegments;
  private synapticPositions!: Float32Array;
  private maxSynapticLines = 400;
  private selectorRing!: THREE.Mesh;
  private terrainMesh!: THREE.Mesh;
  private particleSystem!: THREE.Points;
  private coreMonolithGroup!: THREE.Group;

  constructor(options: SceneManagerOptions) {
    this.container = options.container;
    this.engine = options.engine;
    this.onSelectEntity = options.onSelectEntity;
    this.onSelectStructure = options.onSelectStructure;
    this.onWorldClick = options.onWorldClick;

    this.initWebGL();
    this.setupScene();
    this.setupLights();
    this.setupTerrain();
    this.setupEntitiesInstancing();
    this.setupSynapticLines();
    this.setupSelectorHighlight();
    this.setupBackgroundParticles();
    this.setupInteractions();

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);

    this.startLoop();
  }

  private initWebGL() {
    this.isSoftwareGl = (() => {
      if (typeof document === 'undefined') return true;
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.5, 900);
    this.camera.position.copy(this.currentCameraPos);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060814);
    this.scene.fog = new THREE.FogExp2(0x060814, 0.0035);

    // Procedural RoomEnvironment for PBR metallic reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();
  }

  private setupScene() {
    // Zero 404 procedural textures and composite models
  }

  private setupLights() {
    // Warm key directional light with tight shadow frustum
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    keyLight.position.set(60, 90, 50);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 300;
    const d = WORLD_BOUNDS * 0.9;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // Cool hemisphere sky/ground fill
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.2);
    hemiLight.position.set(0, 80, 0);
    this.scene.add(hemiLight);

    // Subtle cyan backlight for edge cybernetic luminescence
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.4);
    rimLight.position.set(-60, 40, -60);
    this.scene.add(rimLight);
  }

  private createCyberGridTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Deep obsidian/slate base
    ctx.fillStyle = '#0a0e1c';
    ctx.fillRect(0, 0, size, size);

    // Subtle cybernetic circuit grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    const step = 32;
    for (let x = 0; x <= size; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // Glowing micro-nodes at intersections
    ctx.fillStyle = '#0284c7';
    for (let x = step; x < size; x += step * 2) {
      for (let y = step; y < size; y += step * 2) {
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  private setupTerrain() {
    const terrainGeo = new THREE.CylinderGeometry(WORLD_BOUNDS + 15, WORLD_BOUNDS + 30, 8, 48);
    const gridTexture = this.createCyberGridTexture();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: gridTexture,
      roughness: 0.65,
      metalness: 0.25,
      color: 0x111827,
    });

    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.position.y = -4.01;
    this.terrainMesh.receiveShadow = !this.isSoftwareGl;
    this.scene.add(this.terrainMesh);

    // Outer boundary glowing perimeter ring
    const ringGeo = new THREE.RingGeometry(WORLD_BOUNDS + 12, WORLD_BOUNDS + 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.05;
    this.scene.add(ringMesh);

    // Build Central Prime Nexus Anchor (3-12 part procedural composite model)
    this.buildCoreMonolith();
  }

  private buildCoreMonolith() {
    this.coreMonolithGroup = new THREE.Group();
    this.coreMonolithGroup.position.set(0, 0, 0);

    // 1. Tiered polygonal base platform
    const baseGeo = new THREE.CylinderGeometry(14, 18, 2.5, 8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.85,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 1.25;
    base.receiveShadow = !this.isSoftwareGl;
    base.castShadow = !this.isSoftwareGl;
    this.coreMonolithGroup.add(base);

    // 2. Central levitating crystalline octahedron
    const crystalGeo = new THREE.OctahedronGeometry(6, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.4,
      transmission: this.isSoftwareGl ? 0 : 0.85,
      transparent: true,
      opacity: this.isSoftwareGl ? 0.85 : 0.95,
      ior: 1.6,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 14;
    crystal.name = 'floating_crystal';
    this.coreMonolithGroup.add(crystal);

    // 3. Levitating counter-rotating outer ring
    const ringGeo = new THREE.TorusGeometry(10, 0.45, 12, 36);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.35;
    ring.position.y = 14;
    ring.name = 'rotating_ring';
    this.coreMonolithGroup.add(ring);

    // 4. Contact shadow disc underneath
    const shadowGeo = new THREE.CircleGeometry(16, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.coreMonolithGroup.add(shadow);

    this.scene.add(this.coreMonolithGroup);
  }

  private setupEntitiesInstancing() {
    // Procedural 3D Entity shape: sleek tetra-delta prism
    const entityGeo = new THREE.ConeGeometry(0.9, 2.2, 4);
    entityGeo.rotateX(Math.PI / 2); // Orient forward along Z

    const entityMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.65,
    });

    this.entityInstancedMesh = new THREE.InstancedMesh(
      entityGeo,
      entityMat,
      this.maxEntityInstances
    );
    this.entityInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.entityInstancedMesh.castShadow = !this.isSoftwareGl;
    this.entityInstancedMesh.receiveShadow = !this.isSoftwareGl;
    this.entityInstancedMesh.frustumCulled = false;

    this.scene.add(this.entityInstancedMesh);
  }

  private setupSynapticLines() {
    this.synapticPositions = new Float32Array(this.maxSynapticLines * 2 * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(this.synapticPositions, 3));

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });

    this.synapticLinesMesh = new THREE.LineSegments(lineGeo, lineMat);
    this.synapticLinesMesh.frustumCulled = false;
    this.scene.add(this.synapticLinesMesh);
  }

  private setupSelectorHighlight() {
    const ringGeo = new THREE.RingGeometry(1.6, 2.1, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    this.selectorRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectorRing.rotation.x = -Math.PI / 2;
    this.selectorRing.position.y = 0.15;
    this.selectorRing.visible = false;
    this.scene.add(this.selectorRing);
  }

  private setupBackgroundParticles() {
    const count = 350;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 40 + Math.random() * (WORLD_BOUNDS + 50);
      const theta = Math.random() * Math.PI * 2;
      const y = 5 + Math.random() * 60;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 1.4,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(geo, mat);
    this.scene.add(this.particleSystem);
  }

  private setupInteractions() {
    const dom = this.renderer.domElement;

    const onPointerDown = (e: MouseEvent) => {
      this.isDragging = e.button === 0;
      this.isRightDragging = e.button === 2;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      this.isCinematicTour = false; // User interaction cancels cinematic tour
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!this.isDragging && !this.isRightDragging) return;
      const dx = e.clientX - this.previousMousePosition.x;
      const dy = e.clientY - this.previousMousePosition.y;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };

      if (this.isDragging) {
        // Orbit camera around currentLookAt
        const offset = _vec3.copy(this.targetCameraPos).sub(this.targetLookAt);
        const radius = offset.length();
        let theta = Math.atan2(offset.x, offset.z);
        let phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));

        theta -= dx * 0.007;
        phi = Math.max(0.15, Math.min(Math.PI * 0.44, phi + dy * 0.007));

        this.targetCameraPos.x = this.targetLookAt.x + radius * Math.sin(phi) * Math.sin(theta);
        this.targetCameraPos.y = this.targetLookAt.y + radius * Math.cos(phi);
        this.targetCameraPos.z = this.targetLookAt.z + radius * Math.sin(phi) * Math.cos(theta);
      } else if (this.isRightDragging) {
        // Pan camera & lookAt
        const panSpeed = 0.12;
        const forward = _vec3.copy(this.targetLookAt).sub(this.targetCameraPos).normalize();
        const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();

        const moveRight = right.multiplyScalar(-dx * panSpeed);
        const moveForward = new THREE.Vector3(forward.x, 0, forward.z).normalize().multiplyScalar(dy * panSpeed);

        this.targetLookAt.add(moveRight).add(moveForward);
        this.targetCameraPos.add(moveRight).add(moveForward);
      }
    };

    const onPointerUp = (e: MouseEvent) => {
      const moved = Math.abs(e.clientX - this.previousMousePosition.x) + Math.abs(e.clientY - this.previousMousePosition.y);
      this.isDragging = false;
      this.isRightDragging = false;

      // Handle click selection if pointer didn't drag significantly
      if (moved < 5 && e.button === 0) {
        this.handleClickRaycast(e.clientX, e.clientY);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.isCinematicTour = false;
      const zoomFactor = e.deltaY * 0.08;
      const dir = _vec3.copy(this.targetCameraPos).sub(this.targetLookAt);
      const dist = dir.length();
      const newDist = Math.max(20, Math.min(300, dist + zoomFactor));
      dir.normalize().multiplyScalar(newDist);
      this.targetCameraPos.copy(this.targetLookAt).add(dir);
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('contextmenu', onContextMenu);
  }

  public isPlacementMode = false;

  private handleClickRaycast(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    _raycaster.setFromCamera(_pointer, this.camera);

    const terrainHits = _raycaster.intersectObject(this.terrainMesh);

    // If in placement mode, prioritize terrain click
    if (this.isPlacementMode && terrainHits.length > 0) {
      const pt = terrainHits[0].point;
      if (this.onWorldClick) {
        this.onWorldClick(pt.x, pt.z);
      }
      return;
    }

    // 1. Raycast against structures
    const structureRayTargets: THREE.Object3D[] = [];
    this.structureMeshes.forEach((mesh) => structureRayTargets.push(mesh));

    const structHits = _raycaster.intersectObjects(structureRayTargets, true);
    if (structHits.length > 0) {
      // Find top parent group
      let obj: THREE.Object3D | null = structHits[0].object;
      while (obj && !obj.userData?.structureId && obj.parent) {
        obj = obj.parent;
      }
      if (obj?.userData?.structureId) {
        const struct = this.engine.structures.find((s) => s.id === obj.userData.structureId);
        if (struct) {
          this.selectStructure(struct);
          return;
        }
      }
    }

    // 2. Check entities within proximity of ray
    let closestEntity: EntityState | null = null;
    let closestDist = 4.0; // Selection threshold

    for (let i = 0; i < this.engine.entities.length; i++) {
      const ent = this.engine.entities[i];
      _vec3.set(ent.x, 1.2, ent.z);
      const screenPos = _vec3.project(this.camera);

      // Check if within bounds
      if (screenPos.z > -1 && screenPos.z < 1) {
        const dx = (screenPos.x - _pointer.x) * (rect.width / 2);
        const dy = (screenPos.y - _pointer.y) * (rect.height / 2);
        const pixelDist = Math.sqrt(dx * dx + dy * dy);
        if (pixelDist < 25 && pixelDist < closestDist * 10) {
          closestDist = pixelDist / 10;
          closestEntity = ent;
        }
      }
    }

    if (closestEntity) {
      this.selectEntity(closestEntity);
      return;
    }

    // 3. World terrain click fallback
    if (terrainHits.length > 0) {
      const pt = terrainHits[0].point;
      this.selectEntity(null);
      this.selectStructure(null);
      if (this.onWorldClick) {
        this.onWorldClick(pt.x, pt.z);
      }
    }
  }

  public selectEntity(entity: EntityState | null) {
    this.selectedEntityId = entity ? entity.id : null;
    this.selectedStructureId = null;

    if (entity) {
      this.selectorRing.visible = true;
      this.selectorRing.position.set(entity.x, 0.15, entity.z);
      const faction = FACTION_DEFINITIONS[entity.factionId];
      if (faction) {
        (this.selectorRing.material as THREE.MeshBasicMaterial).color.set(faction.color);
      }
    } else {
      this.selectorRing.visible = false;
    }

    if (this.onSelectEntity) this.onSelectEntity(entity);
  }

  public selectStructure(structure: StructureNode | null) {
    this.selectedStructureId = structure ? structure.id : null;
    this.selectedEntityId = null;

    if (structure) {
      this.selectorRing.visible = true;
      this.selectorRing.position.set(structure.x, 0.15, structure.z);
      this.selectorRing.scale.set(3.5, 3.5, 3.5);
    } else {
      this.selectorRing.visible = false;
      this.selectorRing.scale.set(1, 1, 1);
    }

    if (this.onSelectStructure) this.onSelectStructure(structure);
  }

  public focusCoordinates(x: number, z: number, dist = 55) {
    this.isCinematicTour = false;
    this.targetLookAt.set(x, 0, z);
    this.targetCameraPos.set(x, dist * 0.7, z + dist);
  }

  public resetToOverview() {
    this.isCinematicTour = false;
    this.targetLookAt.set(0, 0, 0);
    this.targetCameraPos.set(0, 85, 120);
    this.selectEntity(null);
    this.selectStructure(null);
  }

  private onResize() {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private updateStructures() {
    // Sync 3D structure meshes with engine structures
    const existingIds = new Set<string>();

    for (const struct of this.engine.structures) {
      existingIds.add(struct.id);
      let group = this.structureMeshes.get(struct.id);

      if (!group) {
        group = this.buildStructureMesh(struct);
        this.scene.add(group);
        this.structureMeshes.set(struct.id, group);
      }

      // Update position
      group.position.set(struct.x, 0, struct.z);
    }

    // Remove deleted structures
    this.structureMeshes.forEach((mesh, id) => {
      if (!existingIds.has(id)) {
        this.scene.remove(mesh);
        this.structureMeshes.delete(id);
      }
    });
  }

  private buildStructureMesh(struct: StructureNode): THREE.Group {
    const group = new THREE.Group();
    group.userData = { structureId: struct.id };
    const faction = FACTION_DEFINITIONS[struct.factionId];
    const colorHex = faction ? parseInt(faction.color.replace('#', '0x'), 16) : 0x38bdf8;

    if (struct.type === 'energy_relay') {
      // 1. Faceted base
      const baseGeo = new THREE.CylinderGeometry(2.5, 3.5, 1.8, 6);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.3,
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.9;
      group.add(base);

      // 2. Vertical antenna pillar
      const colGeo = new THREE.CylinderGeometry(0.6, 0.9, 9, 6);
      const col = new THREE.Mesh(colGeo, baseMat);
      col.position.y = 5.4;
      group.add(col);

      // 3. Glowing beacon orb
      const orbGeo = new THREE.SphereGeometry(1.6, 16, 16);
      const orbMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.y = 10.5;
      orb.name = 'beacon_orb';
      group.add(orb);
    } else {
      // Synthesis Sanctuary or Defense Spike
      const spikeGeo = new THREE.ConeGeometry(3, 14, 5);
      const spikeMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: colorHex,
        emissiveIntensity: 0.5,
        roughness: 0.25,
        metalness: 0.9,
      });
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.y = 7;
      group.add(spike);
    }

    return group;
  }

  private updateAnomalies(time: number) {
    const activeIds = new Set<string>();

    for (const anom of this.engine.anomalies) {
      activeIds.add(anom.id);
      let mesh = this.anomalyMeshes.get(anom.id);

      if (!mesh) {
        mesh = this.buildAnomalyMesh(anom);
        this.scene.add(mesh);
        this.anomalyMeshes.set(anom.id, mesh);
      }

      mesh.position.set(anom.x, 0, anom.z);
      // Floating animation
      mesh.position.y = Math.sin(time * 2 + anom.x) * 1.5 + 2;
      mesh.rotation.y = time * 0.8;
    }

    this.anomalyMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.anomalyMeshes.delete(id);
      }
    });
  }

  private buildAnomalyMesh(anom: AnomalyInstance): THREE.Group {
    const group = new THREE.Group();
    const colors: Record<AnomalyInstance['type'], number> = {
      data_geyser: 0x06b6d4,
      quantum_monolith: 0xf59e0b,
      entropy_storm: 0xef4444,
      logic_flare: 0x38bdf8,
      genesis_seed: 0x10b981,
      neural_beacon: 0xd946ef,
    };
    const color = colors[anom.type] || 0x38bdf8;

    const coreGeo = new THREE.IcosahedronGeometry(3.5, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.2,
      wireframe: true,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Glowing ground projection ring
    const groundGeo = new THREE.RingGeometry(anom.radius * 0.8, anom.radius, 32);
    const groundMat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const groundRing = new THREE.Mesh(groundGeo, groundMat);
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.y = 0.08;
    group.add(groundRing);

    return group;
  }

  private updateEntitiesAndSynapses() {
    const entities = this.engine.entities;
    const count = Math.min(entities.length, this.maxEntityInstances);
    this.entityInstancedMesh.count = count;

    let synapticLineCount = 0;
    const posAttr = this.synapticLinesMesh.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      const ent = entities[i];

      _vec3.set(ent.x, 1.1, ent.z);
      _quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, ent.rotation);
      const scale = ent.scale;
      _matrix.compose(_vec3, _quat, new THREE.Vector3(scale, scale, scale));
      this.entityInstancedMesh.setMatrixAt(i, _matrix);

      // Set entity color
      _color.setStyle(ent.color);
      this.entityInstancedMesh.setColorAt(i, _color);

      // Build synaptic lines for communicating entities (e.g. socializing or trading)
      if (ent.currentGoal === 'socialize' && synapticLineCount < this.maxSynapticLines) {
        // Find nearest entity of same or friendly faction
        const nearby = this.engine.grid.queryRadius(ent.x, ent.z, 18);
        const partner = nearby.find((p) => p.id !== ent.id);
        if (partner) {
          const idx = synapticLineCount * 6;
          this.synapticPositions[idx] = ent.x;
          this.synapticPositions[idx + 1] = 1.1;
          this.synapticPositions[idx + 2] = ent.z;

          this.synapticPositions[idx + 3] = partner.x;
          this.synapticPositions[idx + 4] = 1.1;
          this.synapticPositions[idx + 5] = partner.z;
          synapticLineCount++;
        }
      }

      // If this entity is selected, update ring position
      if (ent.id === this.selectedEntityId) {
        this.selectorRing.position.set(ent.x, 0.15, ent.z);
        this.selectorRing.visible = true;
      }
    }

    this.entityInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.entityInstancedMesh.instanceColor) {
      this.entityInstancedMesh.instanceColor.needsUpdate = true;
    }

    // Update synaptic lines
    posAttr.needsUpdate = true;
    this.synapticLinesMesh.geometry.setDrawRange(0, synapticLineCount * 2);
  }

  private startLoop() {
    let lastTime = performance.now();

    const tick = (now: number) => {
      if (this.isDisposed) return;
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      const timeSec = now * 0.001;

      // Rotate central monolith crystal and ring
      if (this.coreMonolithGroup) {
        const crystal = this.coreMonolithGroup.getObjectByName('floating_crystal');
        if (crystal) {
          crystal.rotation.y += dt * 0.8;
          crystal.position.y = 14 + Math.sin(timeSec * 2.5) * 1.2;
        }
        const ring = this.coreMonolithGroup.getObjectByName('rotating_ring');
        if (ring) {
          ring.rotation.z -= dt * 0.5;
        }
      }

      // Cinematic camera tour when title screen or idle
      if (this.isCinematicTour) {
        const tourRadius = 140;
        const tourSpeed = 0.12;
        this.targetCameraPos.x = Math.sin(timeSec * tourSpeed) * tourRadius;
        this.targetCameraPos.z = Math.cos(timeSec * tourSpeed) * tourRadius;
        this.targetCameraPos.y = 75 + Math.sin(timeSec * 0.2) * 15;
        this.targetLookAt.set(0, 10, 0);
      }

      // Smooth camera interpolation using exponential damping
      const dampFactor = 1 - Math.exp(-6 * dt);
      this.currentCameraPos.lerp(this.targetCameraPos, dampFactor);
      this.currentLookAt.lerp(this.targetLookAt, dampFactor);

      this.camera.position.copy(this.currentCameraPos);
      this.camera.lookAt(this.currentLookAt);

      // Render simulation 3D elements
      this.updateStructures();
      this.updateAnomalies(timeSec);
      this.updateEntitiesAndSynapses();

      // Slow drift for background particles
      if (this.particleSystem) {
        this.particleSystem.rotation.y = timeSec * 0.02;
      }

      this.renderer.render(this.scene, this.camera);

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);

    this.structureMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.structureMeshes.clear();
    this.anomalyMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.anomalyMeshes.clear();

    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
