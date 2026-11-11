import * as THREE from 'three';
import { HeroId, Team } from '../types/game';

// Shared reusable materials & cached geometries
const textureCanvas = document.createElement('canvas');
textureCanvas.width = 128;
textureCanvas.height = 128;
const ctx2d = textureCanvas.getContext('2d')!;
ctx2d.fillStyle = '#374151';
ctx2d.fillRect(0, 0, 128, 128);
ctx2d.strokeStyle = '#4b5563';
ctx2d.lineWidth = 4;
ctx2d.strokeRect(4, 4, 120, 120);
const stoneTexture = new THREE.CanvasTexture(textureCanvas);
stoneTexture.wrapS = THREE.RepeatWrapping;
stoneTexture.wrapT = THREE.RepeatWrapping;
stoneTexture.colorSpace = THREE.SRGBColorSpace;

/**
 * Creates a 3D composite hero model (3-12 distinct parts)
 */
export function createHeroMesh(heroId: HeroId, team: Team): THREE.Group {
  const root = new THREE.Group();
  const teamColor = team === 'player' ? 0x38bdf8 : 0xef4444;
  const teamAccent = team === 'player' ? 0x0284c7 : 0xb91c1c;

  // Base selection / team ring decal on ground
  const ringGeo = new THREE.RingGeometry(0.85, 1.05, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: teamColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.04;
  root.add(ringMesh);

  // Soft contact shadow disc
  const shadowGeo = new THREE.CircleGeometry(0.9, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // Body container (pivoted bottom-center)
  const body = new THREE.Group();
  root.add(body);

  if (heroId === 'layla') {
    // LAYLA: Cyberpunk Energy Gunner
    // 1. Torso / Bodice
    const torsoGeo = new THREE.CylinderGeometry(0.3, 0.25, 0.8, 12);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Cyan-blue suit
      metalness: 0.3,
      roughness: 0.45,
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    body.add(torso);

    // 2. Head & Face
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xfde047, // Blonde hair base / cute face
      metalness: 0.1,
      roughness: 0.7,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.6;
    head.castShadow = true;
    body.add(head);

    // 3. Iconic Twin Pigtails (Layla signature!)
    const pigtailGeo = new THREE.CylinderGeometry(0.06, 0.12, 0.9, 8);
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.85,
    });
    const leftPigtail = new THREE.Mesh(pigtailGeo, hairMat);
    leftPigtail.position.set(-0.35, 1.45, -0.1);
    leftPigtail.rotation.z = 0.35;
    leftPigtail.rotation.x = -0.2;
    body.add(leftPigtail);

    const rightPigtail = new THREE.Mesh(pigtailGeo, hairMat);
    rightPigtail.position.set(0.35, 1.45, -0.1);
    rightPigtail.rotation.z = -0.35;
    rightPigtail.rotation.x = -0.2;
    body.add(rightPigtail);

    // 4. Legs / Combat boots
    const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.65, 8);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.5 });
    const leftLeg = new THREE.Mesh(legGeo, bootMat);
    leftLeg.position.set(-0.16, 0.35, 0);
    leftLeg.castShadow = true;
    body.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, bootMat);
    rightLeg.position.set(0.16, 0.35, 0);
    rightLeg.castShadow = true;
    body.add(rightLeg);

    // 5. Giant Malefic Cannon (Layla's signature weapon!)
    const cannonGroup = new THREE.Group();
    cannonGroup.position.set(0.35, 1.05, 0.25);

    const barrelGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.3, 16);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.2,
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.45;
    barrel.castShadow = true;
    cannonGroup.add(barrel);

    // Glowing cannon power core
    const coreGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.3, 12);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.rotation.x = Math.PI / 2;
    core.position.z = 0.1;
    cannonGroup.add(core);

    body.add(cannonGroup);
  } else if (heroId === 'tigreal') {
    // TIGREAL: Heavy Armored Knight of Dawn
    // 1. Torso Plate Armor
    const plateGeo = new THREE.CylinderGeometry(0.45, 0.35, 0.9, 10);
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Polished silver-steel
      metalness: 0.9,
      roughness: 0.18,
    });
    const plate = new THREE.Mesh(plateGeo, armorMat);
    plate.position.y = 1.05;
    plate.castShadow = true;
    body.add(plate);

    // 2. Gold Trim Lion Crest Chestpiece
    const trimGeo = new THREE.BoxGeometry(0.35, 0.4, 0.2);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      roughness: 0.25,
    });
    const chestTrim = new THREE.Mesh(trimGeo, goldMat);
    chestTrim.position.set(0, 1.1, 0.25);
    body.add(chestTrim);

    // 3. Winged Heavy Knight Helmet
    const helmGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.5, 12);
    const helm = new THREE.Mesh(helmGeo, armorMat);
    helm.position.y = 1.7;
    helm.castShadow = true;
    body.add(helm);

    const plumeGeo = new THREE.BoxGeometry(0.08, 0.4, 0.5);
    const plumeMat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.6 });
    const plume = new THREE.Mesh(plumeGeo, plumeMat);
    plume.position.set(0, 2.0, -0.05);
    body.add(plume);

    // 4. Large Pauldrons (Shoulder Guards)
    const pauldronGeo = new THREE.SphereGeometry(0.28, 12, 12);
    const leftPauldron = new THREE.Mesh(pauldronGeo, goldMat);
    leftPauldron.position.set(-0.55, 1.35, 0);
    body.add(leftPauldron);
    const rightPauldron = new THREE.Mesh(pauldronGeo, goldMat);
    rightPauldron.position.set(0.55, 1.35, 0);
    body.add(rightPauldron);

    // 5. Huge Paladin War Hammer
    const hammerGroup = new THREE.Group();
    hammerGroup.position.set(0.65, 0.8, 0.2);
    const shaftGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8);
    const shaft = new THREE.Mesh(shaftGeo, goldMat);
    shaft.position.y = 0.3;
    hammerGroup.add(shaft);

    const hammerHeadGeo = new THREE.BoxGeometry(0.45, 0.5, 0.4);
    const hammerHead = new THREE.Mesh(hammerHeadGeo, armorMat);
    hammerHead.position.y = 1.0;
    hammerGroup.add(hammerHead);
    body.add(hammerGroup);

    // 6. Tower Shield
    const shieldGeo = new THREE.BoxGeometry(0.6, 1.0, 0.12);
    const shield = new THREE.Mesh(shieldGeo, goldMat);
    shield.position.set(-0.55, 0.95, 0.35);
    shield.rotation.y = 0.3;
    body.add(shield);
  } else if (heroId === 'eudora') {
    // EUDORA: Lightning Sorceress
    // 1. Flowing Mage Robe / Dress
    const robeGeo = new THREE.ConeGeometry(0.55, 1.3, 16);
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x4f46e5, // Deep royal indigo
      roughness: 0.55,
      metalness: 0.2,
    });
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 0.65;
    robe.castShadow = true;
    body.add(robe);

    // 2. Crystal Corset / Torso
    const corsetGeo = new THREE.CylinderGeometry(0.25, 0.22, 0.55, 12);
    const corsetMat = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      metalness: 0.6,
      roughness: 0.3,
    });
    const corset = new THREE.Mesh(corsetGeo, corsetMat);
    corset.position.y = 1.25;
    body.add(corset);

    // 3. Head & High Sorceress Crown
    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xe0e7ff, roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.65;
    body.add(head);

    const crownGeo = new THREE.ConeGeometry(0.26, 0.45, 6);
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x4338ca,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.7,
    });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 1.95;
    body.add(crown);

    // 4. Levitating Lightning Orb Staff
    const staffGroup = new THREE.Group();
    staffGroup.position.set(0.45, 0.7, 0.2);
    const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8);
    const rod = new THREE.Mesh(rodGeo, corsetMat);
    rod.position.y = 0.3;
    staffGroup.add(rod);

    // Pulsing lightning tip
    const orbGeo = new THREE.IcosahedronGeometry(0.2, 2);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.0,
      roughness: 0.1,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.y = 1.15;
    staffGroup.add(orb);
    body.add(staffGroup);
  } else if (heroId === 'alucard') {
    // ALUCARD: Demon Hunter with Demonic Arm & Greatsword
    // 1. Trench Coat / Body
    const coatGeo = new THREE.CylinderGeometry(0.35, 0.48, 1.1, 10);
    const coatMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b, // Midnight blue coat
      roughness: 0.65,
      metalness: 0.15,
    });
    const coat = new THREE.Mesh(coatGeo, coatMat);
    coat.position.y = 0.95;
    coat.castShadow = true;
    body.add(coat);

    // 2. Head with Spiky Silver Hair
    const headGeo = new THREE.SphereGeometry(0.22, 14, 14);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.6;
    body.add(head);

    const hairGeo = new THREE.ConeGeometry(0.28, 0.45, 8);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.82, -0.05);
    body.add(hair);

    // 3. Demonic Claw Arm (Right Arm)
    const demonArmGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.7, 8);
    const demonMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Crimson demonic gauntlet
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.3,
    });
    const demonArm = new THREE.Mesh(demonArmGeo, demonMat);
    demonArm.position.set(0.42, 1.15, 0.15);
    demonArm.rotation.z = -0.3;
    body.add(demonArm);

    // 4. Massive Greatsword
    const swordGroup = new THREE.Group();
    swordGroup.position.set(0.55, 0.7, 0.35);
    swordGroup.rotation.x = 0.4;

    const bladeGeo = new THREE.BoxGeometry(0.22, 1.6, 0.05);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.95,
      roughness: 0.1,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.5;
    swordGroup.add(blade);

    const hiltGeo = new THREE.BoxGeometry(0.4, 0.08, 0.1);
    const hilt = new THREE.Mesh(hiltGeo, demonMat);
    hilt.position.y = -0.3;
    swordGroup.add(hilt);
    body.add(swordGroup);
  } else {
    // MIYA: Moonlight Elf Archer
    // 1. Sleek Elven Bodysuit & Skirt
    const torsoGeo = new THREE.CylinderGeometry(0.26, 0.22, 0.75, 12);
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0x059669, // Emerald / teal elf ranger
      roughness: 0.45,
      metalness: 0.25,
    });
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    body.add(torso);

    // 2. Head with Long Silver Ponytail
    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.58;
    body.add(head);

    const ponytailGeo = new THREE.CylinderGeometry(0.05, 0.14, 1.0, 8);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const ponytail = new THREE.Mesh(ponytailGeo, hairMat);
    ponytail.position.set(0, 1.4, -0.3);
    ponytail.rotation.x = -0.5;
    body.add(ponytail);

    // 3. Elven Quiver on Back
    const quiverGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.7, 8);
    const quiverMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const quiver = new THREE.Mesh(quiverGeo, quiverMat);
    quiver.position.set(-0.15, 1.15, -0.2);
    quiver.rotation.z = -0.4;
    body.add(quiver);

    // 4. Glowing Moonlight Bow
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0.35, 1.1, 0.2);
    const bowGeo = new THREE.TorusGeometry(0.6, 0.04, 8, 24, Math.PI);
    const bowMat = new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      emissive: 0x059669,
      emissiveIntensity: 0.6,
      metalness: 0.5,
      roughness: 0.3,
    });
    const bow = new THREE.Mesh(bowGeo, bowMat);
    bow.rotation.y = Math.PI / 2;
    bow.position.z = 0.2;
    bowGroup.add(bow);
    body.add(bowGroup);
  }

  return root;
}

/**
 * Creates 3D Minion Model (Melee or Ranged)
 */
export function createMinionMesh(type: 'melee' | 'ranged', team: Team): THREE.Group {
  const root = new THREE.Group();
  const teamColor = team === 'player' ? 0x0284c7 : 0xdc2626;

  // Contact shadow
  const shadowGeo = new THREE.CircleGeometry(0.45, 16);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  // Minion body
  const body = new THREE.Group();
  root.add(body);

  if (type === 'melee') {
    // Little armored soldier with sword and shield
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.5, 8);
    const armorMat = new THREE.MeshStandardMaterial({ color: teamColor, metalness: 0.6, roughness: 0.4 });
    const torso = new THREE.Mesh(torsoGeo, armorMat);
    torso.position.y = 0.45;
    torso.castShadow = true;
    body.add(torso);

    const headGeo = new THREE.SphereGeometry(0.18, 10, 10);
    const helmMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.2 });
    const head = new THREE.Mesh(headGeo, helmMat);
    head.position.y = 0.8;
    body.add(head);

    // Mini shield
    const shieldGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 10);
    const shield = new THREE.Mesh(shieldGeo, armorMat);
    shield.position.set(-0.3, 0.45, 0.15);
    shield.rotation.x = Math.PI / 2;
    body.add(shield);

    // Mini sword
    const swordGeo = new THREE.BoxGeometry(0.06, 0.6, 0.02);
    const swordMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
    const sword = new THREE.Mesh(swordGeo, swordMat);
    sword.position.set(0.3, 0.45, 0.15);
    body.add(sword);
  } else {
    // Ranged wizard minion with cowl and staff
    const robeGeo = new THREE.ConeGeometry(0.28, 0.6, 10);
    const robeMat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.6 });
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 0.35;
    body.add(robe);

    const hatGeo = new THREE.ConeGeometry(0.22, 0.35, 8);
    const hat = new THREE.Mesh(hatGeo, robeMat);
    hat.position.y = 0.82;
    body.add(hat);

    // Casting wand
    const wandGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6);
    const wand = new THREE.Mesh(wandGeo, new THREE.MeshStandardMaterial({ color: 0x78350f }));
    wand.position.set(0.28, 0.45, 0.15);
    body.add(wand);

    // Wand glowing tip
    const tipGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: teamColor,
      emissiveIntensity: 0.8,
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.set(0.28, 0.8, 0.15);
    body.add(tip);
  }

  return root;
}

/**
 * Creates 3D Turret Model (Tower with rotating energy crystal)
 */
export function createTurretMesh(team: Team): { root: THREE.Group; crystal: THREE.Mesh; ring: THREE.Mesh } {
  const root = new THREE.Group();
  const teamColor = team === 'player' ? 0x0284c7 : 0xdc2626;
  const glowColor = team === 'player' ? 0x38bdf8 : 0xf87171;

  // Base Pedestal (Layer 1)
  const baseGeo = new THREE.CylinderGeometry(1.4, 1.8, 0.8, 12);
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.8,
    metalness: 0.1,
  });
  const base = new THREE.Mesh(baseGeo, stoneMat);
  base.position.y = 0.4;
  base.castShadow = true;
  base.receiveShadow = true;
  root.add(base);

  // Middle Spire Pillar (Layer 2)
  const spireGeo = new THREE.CylinderGeometry(0.85, 1.15, 2.8, 10);
  const spireMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.4,
  });
  const spire = new THREE.Mesh(spireGeo, spireMat);
  spire.position.y = 2.2;
  spire.castShadow = true;
  root.add(spire);

  // Floating Faction Ring
  const ringGeo = new THREE.TorusGeometry(1.0, 0.12, 12, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: teamColor,
    emissive: glowColor,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.8,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 3.6;
  root.add(ring);

  // Floating Rotating Crystal Core
  const crystalGeo = new THREE.OctahedronGeometry(0.7, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 1.0,
    roughness: 0.1,
    metalness: 0.2,
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.y = 4.2;
  crystal.castShadow = true;
  root.add(crystal);

  // Turret Attack Range circle indicator on ground (faint)
  const rangeGeo = new THREE.RingGeometry(6.9, 7.05, 48);
  const rangeMat = new THREE.MeshBasicMaterial({
    color: teamColor,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
  });
  const rangeDecal = new THREE.Mesh(rangeGeo, rangeMat);
  rangeDecal.rotation.x = -Math.PI / 2;
  rangeDecal.position.y = 0.05;
  root.add(rangeDecal);

  return { root, crystal, ring };
}

/**
 * Creates 3D Base Nexus (Core Shrine)
 */
export function createNexusMesh(team: Team): { root: THREE.Group; core: THREE.Mesh } {
  const root = new THREE.Group();
  const teamColor = team === 'player' ? 0x0284c7 : 0xdc2626;
  const glowColor = team === 'player' ? 0x38bdf8 : 0xf87171;

  // Octagonal base altar
  const altarGeo = new THREE.CylinderGeometry(2.6, 3.2, 1.0, 8);
  const altarMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.3,
  });
  const altar = new THREE.Mesh(altarGeo, altarMat);
  altar.position.y = 0.5;
  altar.castShadow = true;
  root.add(altar);

  // 4 corner shrine obelisks
  const obeliskGeo = new THREE.BoxGeometry(0.5, 2.2, 0.5);
  const obeliskMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
  const offsets = [
    [-1.8, -1.8],
    [1.8, -1.8],
    [-1.8, 1.8],
    [1.8, 1.8],
  ];
  offsets.forEach(([ox, oz]) => {
    const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
    obelisk.position.set(ox, 1.6, oz);
    obelisk.castShadow = true;
    root.add(obelisk);
  });

  // Massive Pulsing Nexus Monolith Core
  const coreGeo = new THREE.DodecahedronGeometry(1.4, 0);
  const coreMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: teamColor,
    emissiveIntensity: 1.2,
    roughness: 0.15,
    metalness: 0.3,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 2.6;
  core.castShadow = true;
  root.add(core);

  return { root, core };
}

/**
 * Creates Bush / Tall Grass cluster for stealth camouflage
 */
export function createBushMesh(x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const leafGeo = new THREE.SphereGeometry(0.65, 8, 8);
  const bushMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // Lush deep grass green
    roughness: 0.9,
    metalness: 0.05,
  });

  // Cluster of 6 overlapping shrub spheres
  const positions = [
    [0, 0.5, 0],
    [-0.4, 0.45, 0.3],
    [0.4, 0.45, -0.2],
    [0.2, 0.55, 0.4],
    [-0.3, 0.4, -0.3],
    [0.5, 0.38, 0.25],
  ];

  positions.forEach(([bx, by, bz]) => {
    const shrub = new THREE.Mesh(leafGeo, bushMat);
    shrub.position.set(bx, by, bz);
    shrub.scale.set(0.9 + Math.random() * 0.2, 0.8 + Math.random() * 0.3, 0.9 + Math.random() * 0.2);
    shrub.castShadow = true;
    group.add(shrub);
  });

  return group;
}

/**
 * Creates River Crab (Healing creep) in center of the map
 */
export function createCrabMesh(): THREE.Group {
  const crab = new THREE.Group();

  // Crab shell
  const shellGeo = new THREE.SphereGeometry(0.55, 12, 10);
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x059669,
    roughness: 0.4,
    metalness: 0.2,
  });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.scale.set(1.1, 0.5, 0.9);
  shell.position.y = 0.3;
  crab.add(shell);

  // Golden healing gem on back
  const gemGeo = new THREE.OctahedronGeometry(0.2, 0);
  const gemMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xeab308,
    emissiveIntensity: 0.8,
    roughness: 0.1,
  });
  const gem = new THREE.Mesh(gemGeo, gemMat);
  gem.position.set(0, 0.65, 0);
  crab.add(gem);

  // Pincers
  const pincerGeo = new THREE.BoxGeometry(0.35, 0.15, 0.15);
  const leftPincer = new THREE.Mesh(pincerGeo, shellMat);
  leftPincer.position.set(-0.6, 0.25, 0.35);
  crab.add(leftPincer);
  const rightPincer = new THREE.Mesh(pincerGeo, shellMat);
  rightPincer.position.set(0.6, 0.25, 0.35);
  crab.add(rightPincer);

  return crab;
}
