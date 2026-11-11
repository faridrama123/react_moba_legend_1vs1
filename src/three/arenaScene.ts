import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface VisualEffect {
  id: string;
  type: 'laser' | 'lightning' | 'shockwave' | 'slash' | 'hit_spark' | 'recall' | 'level_up';
  mesh: THREE.Object3D;
  duration: number;
  elapsed: number;
  update?: (dt: number) => void;
}

export class ArenaScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public isSoftwareGl: boolean;
  public activeEffects: VisualEffect[] = [];
  public turretCrystals: { crystal: THREE.Mesh; ring: THREE.Mesh }[] = [];
  public nexusCores: THREE.Mesh[] = [];

  // Reusable vectors for zero-allocation tick loops
  private _camTarget = new THREE.Vector3();
  private _camIdealPos = new THREE.Vector3();
  private shakeIntensity = 0;
  private shakeDecay = 6.0;

  constructor(container: HTMLDivElement) {
    // 1. Detect software WebGL as prescribed by threejs skill
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera Setup (MOBA Isometric 2.5D view)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a101d);
    this.scene.fog = new THREE.FogExp2(0x0a101d, 0.015);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 1, 140);
    // Positioned behind and above player hero looking forward at ~55-degree tilt
    this.camera.position.set(0, 24, -28);
    this.camera.lookAt(0, 0, -10);

    // 4. RoomEnvironment for Studio PBR Reflections
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {
      // Graceful fallback
    }

    // 5. Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.85);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    sunLight.position.set(18, 32, -15);
    if (!this.isSoftwareGl) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 5;
      sunLight.shadow.camera.far = 80;
      sunLight.shadow.camera.left = -30;
      sunLight.shadow.camera.right = 30;
      sunLight.shadow.camera.top = 30;
      sunLight.shadow.camera.bottom = -30;
      sunLight.shadow.bias = -0.0004;
      sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    rimLight.position.set(-20, 15, 20);
    this.scene.add(rimLight);

    // 6. Build the 3D MOBA Arena Terrain & Atmosphere
    this.buildTerrain();
  }

  private buildTerrain() {
    // Broad outdoor terrain floor
    const terrainGeo = new THREE.PlaneGeometry(160, 220, 32, 32);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x111c2e, // Deep mystical MOBA ground
      roughness: 0.85,
      metalness: 0.1,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    // Central Stone Pathway / Lane (Z from -52 to +52, width 10)
    const laneGeo = new THREE.PlaneGeometry(9.6, 108, 16, 64);
    const laneMat = new THREE.MeshStandardMaterial({
      color: 0x273549, // Ancient rune stones
      roughness: 0.65,
      metalness: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const lane = new THREE.Mesh(laneGeo, laneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.position.y = 0.02;
    lane.receiveShadow = true;
    this.scene.add(lane);

    // Lane border curbs
    const curbGeo = new THREE.BoxGeometry(0.35, 0.2, 108);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-4.95, 0.1, 0);
    leftCurb.castShadow = true;
    this.scene.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(4.95, 0.1, 0);
    rightCurb.castShadow = true;
    this.scene.add(rightCurb);

    // River across the center (Z: -6 to +6, X: -40 to +40)
    const riverGeo = new THREE.PlaneGeometry(80, 12);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.7,
      transparent: true,
      opacity: 0.85,
    });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, 0.03, 0);
    this.scene.add(river);

    // River Bridge (Arch stone bridge crossing the river)
    const bridgeGeo = new THREE.BoxGeometry(10.2, 0.35, 14);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.3,
    });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(0, 0.18, 0);
    bridge.receiveShadow = true;
    this.scene.add(bridge);

    // Natural perimeter barriers: rock boulders, cliffs, and ancient pillars
    const rockGeo = new THREE.DodecahedronGeometry(1.6, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

    // Place natural rocks along both sides of the lane
    for (let z = -50; z <= 50; z += 12) {
      if (Math.abs(z) < 4) continue; // Keep river passage clear
      // Left cliff rocks
      const rockL = new THREE.Mesh(rockGeo, rockMat);
      const scaleL = 1.0 + Math.random() * 0.8;
      rockL.scale.set(scaleL, scaleL * 1.5, scaleL);
      rockL.position.set(-8.5 - Math.random() * 3, scaleL * 0.7, z + (Math.random() - 0.5) * 4);
      rockL.rotation.set(Math.random(), Math.random(), Math.random());
      rockL.castShadow = true;
      this.scene.add(rockL);

      // Right cliff rocks
      const rockR = new THREE.Mesh(rockGeo, rockMat);
      const scaleR = 1.0 + Math.random() * 0.8;
      rockR.scale.set(scaleR, scaleR * 1.5, scaleR);
      rockR.position.set(8.5 + Math.random() * 3, scaleR * 0.7, z + (Math.random() - 0.5) * 4);
      rockR.rotation.set(Math.random(), Math.random(), Math.random());
      rockR.castShadow = true;
      this.scene.add(rockR);
    }

    // Ancient Ruin Torch Pillars along the lane
    const pillarGeo = new THREE.CylinderGeometry(0.35, 0.45, 2.8, 8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const torchZ = [-38, -22, -8, 8, 22, 38];

    torchZ.forEach((tz) => {
      // Left pillar
      const pilL = new THREE.Mesh(pillarGeo, pillarMat);
      pilL.position.set(-5.6, 1.4, tz);
      pilL.castShadow = true;
      this.scene.add(pilL);

      // Left torch flame
      const flameGeo = new THREE.OctahedronGeometry(0.25, 0);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const flameL = new THREE.Mesh(flameGeo, flameMat);
      flameL.position.set(-5.6, 2.9, tz);
      this.scene.add(flameL);

      // Right pillar
      const pilR = new THREE.Mesh(pillarGeo, pillarMat);
      pilR.position.set(5.6, 1.4, tz);
      pilR.castShadow = true;
      this.scene.add(pilR);

      // Right torch flame
      const flameR = new THREE.Mesh(flameGeo, flameMat);
      flameR.position.set(5.6, 2.9, tz);
      this.scene.add(flameR);
    });
  }

  // Camera smooth follow with subtle lead and decay camera shake
  public updateCamera(targetX: number, targetZ: number, dt: number) {
    this._camTarget.set(targetX, 0.5, targetZ);
    // Isometric offset: Y = 22 above, Z offset = -18 (behind player looking towards enemy base)
    this._camIdealPos.set(targetX * 0.7, 21, targetZ - 17.5);

    // Exponential smoothing
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this._camIdealPos.x, 6, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this._camIdealPos.y, 6, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this._camIdealPos.z, 6, dt);

    // Apply camera shake if active
    if (this.shakeIntensity > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }

    this.camera.lookAt(targetX * 0.5, 0.6, targetZ + 3.5);
  }

  public triggerCameraShake(intensity: number = 0.5) {
    this.shakeIntensity = Math.min(1.2, this.shakeIntensity + intensity);
  }

  // Create Layla Ultimate Destruction Rush Laser Beam
  public spawnLaserBeam(startX: number, startZ: number, targetX: number, targetZ: number, length: number = 24) {
    const dir = new THREE.Vector3(targetX - startX, 0, targetZ - startZ).normalize();
    const beamGeo = new THREE.CylinderGeometry(0.45, 0.5, length, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(beamGeo, beamMat);

    // Orient cylinder along dir
    mesh.position.set(startX + dir.x * (length / 2), 1.2, startZ + dir.z * (length / 2));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    this.scene.add(mesh);
    this.triggerCameraShake(0.65);

    this.activeEffects.push({
      id: Math.random().toString(),
      type: 'laser',
      mesh,
      duration: 0.45,
      elapsed: 0,
      update: (dt) => {
        mesh.scale.x = THREE.MathUtils.lerp(mesh.scale.x, 2.2, dt * 8);
        mesh.scale.z = THREE.MathUtils.lerp(mesh.scale.z, 2.2, dt * 8);
        beamMat.opacity = Math.max(0, beamMat.opacity - dt * 2.2);
      },
    });
  }

  // Create Eudora Thunder's Wrath Lightning Strike
  public spawnLightningStrike(targetX: number, targetZ: number) {
    const group = new THREE.Group();
    group.position.set(targetX, 0, targetZ);

    // High vertical bolt
    const boltGeo = new THREE.CylinderGeometry(0.2, 0.4, 25, 8);
    const boltMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.95,
    });
    const bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.position.y = 12.5;
    group.add(bolt);

    // Ground impact ring
    const ringGeo = new THREE.RingGeometry(0.3, 3.2, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    group.add(ring);

    this.scene.add(group);
    this.triggerCameraShake(0.5);

    this.activeEffects.push({
      id: Math.random().toString(),
      type: 'lightning',
      mesh: group,
      duration: 0.4,
      elapsed: 0,
      update: (dt) => {
        ring.scale.addScalar(dt * 6);
        boltMat.opacity = Math.max(0, boltMat.opacity - dt * 2.5);
        ringMat.opacity = Math.max(0, ringMat.opacity - dt * 2.2);
      },
    });
  }

  // Create Tigreal / Alucard Shockwave Ring
  public spawnShockwave(x: number, z: number, colorHex: number = 0xf97316, maxRadius: number = 4.5) {
    const ringGeo = new THREE.RingGeometry(0.4, 0.9, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const mesh = new THREE.Mesh(ringGeo, ringMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.06, z);
    this.scene.add(mesh);

    this.activeEffects.push({
      id: Math.random().toString(),
      type: 'shockwave',
      mesh,
      duration: 0.35,
      elapsed: 0,
      update: (dt) => {
        mesh.scale.addScalar(dt * 12);
        ringMat.opacity = Math.max(0, ringMat.opacity - dt * 2.4);
      },
    });
  }

  // Level Up Light Pillar
  public spawnLevelUpEffect(heroMesh: THREE.Object3D) {
    const geo = new THREE.CylinderGeometry(0.9, 0.9, 6.0, 16, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const pillar = new THREE.Mesh(geo, mat);
    pillar.position.set(heroMesh.position.x, 3.0, heroMesh.position.z);
    this.scene.add(pillar);

    this.activeEffects.push({
      id: Math.random().toString(),
      type: 'level_up',
      mesh: pillar,
      duration: 0.8,
      elapsed: 0,
      update: (dt) => {
        pillar.position.y += dt * 4;
        mat.opacity = Math.max(0, mat.opacity - dt * 1.1);
      },
    });
  }

  // Update active visual effects
  public updateEffects(dt: number) {
    // Spin turret crystals and nexus cores
    const rot = dt * 1.5;
    this.turretCrystals.forEach(({ crystal, ring }) => {
      crystal.rotation.y += rot;
      ring.rotation.z += rot * 0.7;
    });
    this.nexusCores.forEach((core) => {
      core.rotation.y += rot * 0.8;
      core.rotation.x += rot * 0.4;
    });

    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const fx = this.activeEffects[i];
      fx.elapsed += dt;
      if (fx.update) fx.update(dt);

      if (fx.elapsed >= fx.duration) {
        this.scene.remove(fx.mesh);
        this.activeEffects.splice(i, 1);
      }
    }
  }

  public handleResize(width: number, height: number) {
    if (!height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    this.renderer.dispose();
  }
}
