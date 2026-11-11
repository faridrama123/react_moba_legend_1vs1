import * as THREE from 'three';
import {
  HeroConfig,
  HeroId,
  Team,
  Minion,
  Turret,
  BaseNexus,
  JungleCreep,
  Projectile,
  DamagePopup,
  BattleSpellId,
  Announcement,
  Item,
  HeroState,
} from '../types/game';
export type { HeroState };
import { HEROES, BATTLE_SPELLS, SHOP_ITEMS } from '../data/heroes';
import { soundEngine } from '../audio/soundEngine';
import { ArenaScene } from '../three/arenaScene';
import {
  createHeroMesh,
  createMinionMesh,
  createTurretMesh,
  createNexusMesh,
  createBushMesh,
  createCrabMesh,
} from '../three/models';


export class GameEngine {
  public sceneManager: ArenaScene;
  public player: HeroState;
  public enemy: HeroState;
  public turrets: Turret[] = [];
  public turretMeshes: Map<string, THREE.Group> = new Map();
  public nexuses: BaseNexus[] = [];
  public nexusMeshes: Map<string, THREE.Group> = new Map();
  public minions: Minion[] = [];
  public minionMeshes: Map<string, THREE.Group> = new Map();
  public projectiles: Projectile[] = [];
  public projectileMeshes: Map<string, THREE.Mesh> = new Map();
  public crab: JungleCreep;
  public crabMesh: THREE.Group;
  public bushes: { x: number; z: number; radius: number }[] = [];

  // Game stats
  public gameTime: number = 0;
  public playerKills: number = 0;
  public playerDeaths: number = 0;
  public enemyKills: number = 0;
  public enemyDeaths: number = 0;
  public playerGold: number = 400; // Start with 400 gold like MLBB
  public enemyGold: number = 400;
  public isGameOver: boolean = false;
  public winner: Team | null = null;
  public firstBloodClaimed: boolean = false;
  public announcements: Announcement[] = [];
  public damagePopups: DamagePopup[] = [];

  // Input states
  public moveVector = { x: 0, z: 0 };
  public isMoving: boolean = false;
  private minionSpawnTimer = 0;
  private goldPassiveTimer = 0;

  constructor(
    container: HTMLDivElement,
    playerHeroId: HeroId,
    playerSpell: BattleSpellId,
    enemyHeroId: HeroId,
    enemySpell: BattleSpellId
  ) {
    this.sceneManager = new ArenaScene(container);

    // Initialize Player
    this.player = this.createHeroState(playerHeroId, 'player', playerSpell, 0, -40);
    // Initialize Enemy (AI)
    this.enemy = this.createHeroState(enemyHeroId, 'enemy', enemySpell, 0, 40);

    // Setup Bushes (Stealth patches on side flanks)
    this.setupBushes();

    // Setup River Crab in central river
    this.crab = {
      id: 'river_crab',
      x: 6.5,
      z: 0,
      hp: 1200,
      maxHp: 1200,
      attack: 25,
      attackRange: 1.5,
      isDead: false,
      respawnTimer: 0,
    };
    this.crabMesh = createCrabMesh();
    this.crabMesh.position.set(this.crab.x, 0, this.crab.z);
    this.sceneManager.scene.add(this.crabMesh);

    // Setup Turrets (2 per team: Outer and Base)
    this.setupTurrets();

    // Setup Nexuses (Core bases)
    this.setupNexuses();

    // Start with iconic MLBB audio announcement
    setTimeout(() => {
      this.pushAnnouncement('Welcome to Mobile Legends!', 'Prepare for 1v1 battle', 'welcome', '#38bdf8');
      soundEngine.announce('Welcome to Mobile Legends!');
    }, 600);

    setTimeout(() => {
      this.pushAnnouncement('5 seconds until the enemy reaches the battlefield', 'Smash them!', 'system', '#f59e0b');
      soundEngine.announce('5 seconds until the enemy reaches the battlefield. Smash them!');
    }, 4500);
  }

  private createHeroState(
    heroId: HeroId,
    team: Team,
    spellId: BattleSpellId,
    startX: number,
    startZ: number
  ): HeroState {
    const config = HEROES[heroId];
    const mesh = createHeroMesh(heroId, team);
    mesh.position.set(startX, 0, startZ);
    mesh.rotation.y = team === 'player' ? 0 : Math.PI;
    this.sceneManager.scene.add(mesh);

    return {
      config,
      team,
      level: 1,
      xp: 0,
      nextLevelXp: 180,
      skillPoints: 1, // Can level up 1 skill immediately
      skillLevels: [0, 0, 0],
      hp: config.baseStats.maxHp,
      maxHp: config.baseStats.maxHp,
      mana: config.baseStats.maxMana,
      maxMana: config.baseStats.maxMana,
      physicalAttack: config.baseStats.physicalAttack,
      magicPower: config.baseStats.magicPower,
      armor: config.baseStats.armor,
      magicResist: config.baseStats.magicResist,
      moveSpeed: config.baseStats.moveSpeed,
      attackRange: config.baseStats.attackRange,
      attackSpeed: config.baseStats.attackSpeed,
      isRanged: config.baseStats.isRanged,
      lifesteal: 0,
      isDead: false,
      respawnTime: 0,
      x: startX,
      z: startZ,
      mesh,
      skillCooldowns: [0, 0, 0],
      spellCooldown: 0,
      selectedSpell: spellId,
      lastAttackTime: 0,
      isRecalling: false,
      recallProgress: 0,
      isStealthed: false,
      inBush: false,
      stunTimer: 0,
      inventory: [],
    };
  }

  private setupBushes() {
    // 4 Bush patches flanking the lane
    const bushCoords = [
      { x: -5.8, z: -14, radius: 2.8 },
      { x: 5.8, z: -14, radius: 2.8 },
      { x: -5.8, z: 14, radius: 2.8 },
      { x: 5.8, z: 14, radius: 2.8 },
    ];
    bushCoords.forEach((b) => {
      this.bushes.push(b);
      const bushObj = createBushMesh(b.x, b.z);
      this.sceneManager.scene.add(bushObj);
    });
  }

  private setupTurrets() {
    const turretConfigs = [
      { id: 'player_t1', team: 'player' as Team, tier: 1 as const, x: 0, z: -18, maxHp: 3800, attack: 280 },
      { id: 'player_t2', team: 'player' as Team, tier: 2 as const, x: 0, z: -34, maxHp: 4400, attack: 340 },
      { id: 'enemy_t1', team: 'enemy' as Team, tier: 1 as const, x: 0, z: 18, maxHp: 3800, attack: 280 },
      { id: 'enemy_t2', team: 'enemy' as Team, tier: 2 as const, x: 0, z: 34, maxHp: 4400, attack: 340 },
    ];

    turretConfigs.forEach((tc) => {
      const turret: Turret = {
        id: tc.id,
        team: tc.team,
        tier: tc.tier,
        x: tc.x,
        z: tc.z,
        hp: tc.maxHp,
        maxHp: tc.maxHp,
        attack: tc.attack,
        attackRange: 7.0,
        lastAttackTime: 0,
        targetId: null,
        targetType: null,
        isDead: false,
      };
      this.turrets.push(turret);

      const { root, crystal, ring } = createTurretMesh(tc.team);
      root.position.set(tc.x, 0, tc.z);
      this.sceneManager.scene.add(root);
      this.turretMeshes.set(tc.id, root);
      this.sceneManager.turretCrystals.push({ crystal, ring });
    });
  }

  private setupNexuses() {
    const nexusConfigs = [
      { team: 'player' as Team, x: 0, z: -48, maxHp: 6500 },
      { team: 'enemy' as Team, x: 0, z: 48, maxHp: 6500 },
    ];

    nexusConfigs.forEach((nc) => {
      const nexus: BaseNexus = {
        team: nc.team,
        x: nc.x,
        z: nc.z,
        hp: nc.maxHp,
        maxHp: nc.maxHp,
        isDead: false,
      };
      this.nexuses.push(nexus);

      const { root, core } = createNexusMesh(nc.team);
      root.position.set(nc.x, 0, nc.z);
      this.sceneManager.scene.add(root);
      this.nexusMeshes.set(nc.team, root);
      this.sceneManager.nexusCores.push(core);
    });
  }

  // Upgrade Skill
  public upgradeSkill(slotIndex: number) {
    if (this.player.skillPoints <= 0) return;
    if (slotIndex < 0 || slotIndex > 2) return;
    // Ult only levelable at levels 4, 8, 12
    if (slotIndex === 2 && this.player.level < 4 && this.player.skillLevels[2] === 0) return;

    this.player.skillLevels[slotIndex]++;
    this.player.skillPoints--;
    soundEngine.playLevelUp();
  }

  // Player Basic Attack
  public triggerPlayerAttack() {
    if (this.player.isDead || this.player.stunTimer > 0) return;
    const now = this.gameTime;
    const attackInterval = 1 / this.player.attackSpeed;
    if (now - this.player.lastAttackTime < attackInterval) return;

    // Interrupt recall
    if (this.player.isRecalling) this.cancelRecall(this.player);

    // Find nearest target within attack range:
    // Priority: enemy hero (if in range) > enemy minion > enemy turret > crab > nexus
    const target = this.findAttackTarget(this.player);
    if (!target) return;

    this.player.lastAttackTime = now;
    soundEngine.playAttack(this.player.isRanged);

    // Face the target
    const angle = Math.atan2(target.x - this.player.x, target.z - this.player.z);
    this.player.mesh.rotation.y = angle;

    if (this.player.isRanged) {
      // Spawn ranged projectile
      this.spawnProjectile({
        id: Math.random().toString(),
        team: 'player',
        sourceType: 'hero',
        x: this.player.x,
        y: 1.1,
        z: this.player.z,
        targetX: target.x,
        targetY: 0.8,
        targetZ: target.z,
        targetId: target.id,
        speed: 18,
        damage: this.player.physicalAttack,
        damageType: 'physical',
        color: this.player.config.avatarColor,
        radius: 0.2,
      });
    } else {
      // Melee attack hit immediately with swing effect
      if (target.type === 'hero') {
        this.applyDamageToTarget(this.enemy, this.player.physicalAttack, 'physical', this.player);
      } else if (target.type === 'minion') {
        const m = this.minions.find((min) => min.id === target.id);
        if (m) this.applyDamageToMinion(m, this.player.physicalAttack, this.player);
      } else if (target.type === 'turret') {
        const t = this.turrets.find((tur) => tur.id === target.id);
        if (t) this.applyDamageToTurret(t, this.player.physicalAttack);
      } else if (target.type === 'nexus') {
        const n = this.nexuses.find((nex) => nex.team === 'enemy');
        if (n) this.applyDamageToNexus(n, this.player.physicalAttack);
      } else if (target.type === 'crab') {
        this.crab.hp -= this.player.physicalAttack;
        this.addDamagePopup(`${Math.round(this.player.physicalAttack)}`, this.crab.x, this.crab.z, '#fde047');
        if (this.crab.hp <= 0 && !this.crab.isDead) {
          this.crab.isDead = true;
          this.crab.respawnTimer = 60;
          this.crabMesh.visible = false;
          this.playerGold += 60;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.2);
          this.pushAnnouncement('River Crab Slain!', '+60 Gold & 20% HP Recovered', 'system', '#22c55e');
        }
      }
      this.sceneManager.spawnShockwave(target.x, target.z, 0xf97316, 1.8);
    }
  }

  // Cast Skill
  public castSkill(hero: HeroState, slotIndex: number, targetDir?: { x: number; z: number }) {
    if (hero.isDead || hero.stunTimer > 0) return;
    const skillDef = hero.config.skills[slotIndex];
    if (!skillDef) return;

    // Must be learned
    if (hero.skillLevels[slotIndex] === 0) return;
    // Check Cooldown
    if (hero.skillCooldowns[slotIndex] > 0) return;
    // Check Mana
    if (hero.mana < skillDef.manaCost) return;

    // Interrupt recall
    if (hero.isRecalling) this.cancelRecall(hero);

    hero.mana -= skillDef.manaCost;
    hero.skillCooldowns[slotIndex] = skillDef.cooldown;
    soundEngine.playSkillSound(hero.config.id, skillDef.slot);

    // Direction to aim
    const opponent = hero.team === 'player' ? this.enemy : this.player;
    let dx = targetDir ? targetDir.x : opponent.x - hero.x;
    let dz = targetDir ? targetDir.z : opponent.z - hero.z;
    const dist = Math.hypot(dx, dz) || 1;
    dx /= dist;
    dz /= dist;

    hero.mesh.rotation.y = Math.atan2(dx, dz);

    const dmg = skillDef.damage + (skillDef.damageType === 'magic' ? hero.magicPower * skillDef.damageScaling : hero.physicalAttack * skillDef.damageScaling);

    // Execute Skill Specific Behaviors
    if (hero.config.id === 'layla') {
      if (slotIndex === 0) {
        // S1: Malefic Bomb (fast projectile line)
        this.spawnProjectile({
          id: Math.random().toString(),
          team: hero.team,
          sourceType: 'hero',
          x: hero.x,
          y: 1.1,
          z: hero.z,
          targetX: hero.x + dx * skillDef.range,
          targetY: 1.1,
          targetZ: hero.z + dz * skillDef.range,
          speed: 24,
          damage: dmg,
          damageType: 'physical',
          color: '#38bdf8',
          radius: 0.45,
          pierce: false,
        });
      } else if (slotIndex === 1) {
        // S2: Void Projectile (AoE energy blast)
        const hitX = hero.x + dx * Math.min(skillDef.range, dist);
        const hitZ = hero.z + dz * Math.min(skillDef.range, dist);
        this.sceneManager.spawnShockwave(hitX, hitZ, 0xa855f7, 3.2);
        this.dealAoEDamage(hitX, hitZ, 3.5, dmg, 'magic', hero);
      } else {
        // S3: Destruction Rush (Huge laser cannon beam)
        this.sceneManager.spawnLaserBeam(hero.x, hero.z, hero.x + dx * 20, hero.z + dz * 20, 24);
        // Damage all enemies in line
        this.dealLineDamage(hero.x, hero.z, dx, dz, 24, 2.2, dmg, 'physical', hero);
      }
    } else if (hero.config.id === 'tigreal') {
      if (slotIndex === 0) {
        // S1: Attack Wave
        const waveX = hero.x + dx * 4.5;
        const waveZ = hero.z + dz * 4.5;
        this.sceneManager.spawnShockwave(waveX, waveZ, 0xf97316, 3.8);
        this.dealAoEDamage(waveX, waveZ, 3.8, dmg, 'physical', hero);
      } else if (slotIndex === 1) {
        // S2: Sacred Hammer (Dash and knock up)
        hero.x = Math.max(-6, Math.min(6, hero.x + dx * 4.5));
        hero.z = Math.max(-48, Math.min(48, hero.z + dz * 4.5));
        hero.mesh.position.set(hero.x, 0, hero.z);
        this.sceneManager.spawnShockwave(hero.x, hero.z, 0xeab308, 3.0);
        this.dealAoEDamage(hero.x, hero.z, 3.2, dmg, 'physical', hero, 0.8);
      } else {
        // S3: Implosion (Pull & Stun)
        this.sceneManager.spawnShockwave(hero.x, hero.z, 0xef4444, 5.0);
        this.dealAoEDamage(hero.x, hero.z, 5.0, dmg, 'physical', hero, 1.5, true);
      }
    } else if (hero.config.id === 'eudora') {
      if (slotIndex === 0) {
        // S1: Forked Lightning
        this.sceneManager.spawnShockwave(hero.x + dx * 3.5, hero.z + dz * 3.5, 0x6366f1, 4.0);
        this.dealAoEDamage(hero.x + dx * 3.5, hero.z + dz * 3.5, 4.0, dmg, 'magic', hero);
      } else if (slotIndex === 1) {
        // S2: Ball Lightning (Stun target)
        if (dist <= skillDef.range) {
          this.applyDamageToTarget(opponent, dmg, 'magic', hero);
          opponent.stunTimer = 1.3;
          this.addDamagePopup('STUNNED!', opponent.x, opponent.z, '#60a5fa');
          this.sceneManager.spawnLightningStrike(opponent.x, opponent.z);
        }
      } else {
        // S3: Thunder's Wrath (Ultimate lightning strike)
        const strikeX = dist <= skillDef.range ? opponent.x : hero.x + dx * skillDef.range;
        const strikeZ = dist <= skillDef.range ? opponent.z : hero.z + dz * skillDef.range;
        this.sceneManager.spawnLightningStrike(strikeX, strikeZ);
        this.dealAoEDamage(strikeX, strikeZ, 3.5, dmg, 'magic', hero);
      }
    } else if (hero.config.id === 'alucard') {
      if (slotIndex === 0) {
        // S1: Groundsplitter (Leap & Slam)
        const jumpX = hero.x + dx * Math.min(skillDef.range, dist);
        const jumpZ = hero.z + dz * Math.min(skillDef.range, dist);
        hero.x = Math.max(-6, Math.min(6, jumpX));
        hero.z = Math.max(-48, Math.min(48, jumpZ));
        hero.mesh.position.set(hero.x, 0, hero.z);
        this.sceneManager.spawnShockwave(hero.x, hero.z, 0xdc2626, 3.2);
        this.dealAoEDamage(hero.x, hero.z, 3.2, dmg, 'physical', hero);
      } else if (slotIndex === 1) {
        // S2: Whirling Smash
        this.sceneManager.spawnShockwave(hero.x, hero.z, 0xf97316, 3.5);
        this.dealAoEDamage(hero.x, hero.z, 3.5, dmg, 'physical', hero);
      } else {
        // S3: Fission Wave (Slash wave)
        hero.lifesteal = 0.4;
        this.sceneManager.spawnShockwave(hero.x, hero.z, 0xb91c1c, 4.5);
        this.dealLineDamage(hero.x, hero.z, dx, dz, 10, 3.0, dmg, 'physical', hero);
        setTimeout(() => {
          hero.lifesteal = 0;
        }, 8000);
      }
    } else {
      // MIYA
      if (slotIndex === 0) {
        // S1: Moon Arrow (buff attack speed & split shots)
        hero.attackSpeed *= 1.45;
        this.sceneManager.spawnShockwave(hero.x, hero.z, 0x10b981, 2.0);
        setTimeout(() => {
          hero.attackSpeed = hero.config.baseStats.attackSpeed;
        }, 5000);
      } else if (slotIndex === 1) {
        // S2: Arrow of Eclipse (AoE Immobilize)
        const rainX = hero.x + dx * Math.min(skillDef.range, dist);
        const rainZ = hero.z + dz * Math.min(skillDef.range, dist);
        this.sceneManager.spawnShockwave(rainX, rainZ, 0x06b6d4, 3.2);
        this.dealAoEDamage(rainX, rainZ, 3.2, dmg, 'physical', hero, 1.2);
      } else {
        // S3: Hidden Moonlight (Stealth & speed)
        hero.isStealthed = true;
        hero.mesh.visible = false;
        hero.moveSpeed *= 1.35;
        hero.attackSpeed *= 1.5;
        this.sceneManager.spawnShockwave(hero.x, hero.z, 0x8b5cf6, 2.5);
        setTimeout(() => {
          hero.isStealthed = false;
          hero.mesh.visible = true;
          hero.moveSpeed = hero.config.baseStats.moveSpeed;
          hero.attackSpeed = hero.config.baseStats.attackSpeed;
        }, 2500);
      }
    }
  }

  // Cast Battle Spell
  public castBattleSpell(hero: HeroState) {
    if (hero.isDead || hero.spellCooldown > 0 || hero.stunTimer > 0) return;
    const spellConfig = BATTLE_SPELLS.find((s) => s.id === hero.selectedSpell);
    if (!spellConfig) return;

    hero.spellCooldown = spellConfig.cooldown;

    if (hero.selectedSpell === 'flicker') {
      // Instant blink forward 5 units
      const angle = hero.mesh.rotation.y;
      const fx = hero.x + Math.sin(angle) * 5.2;
      const fz = hero.z + Math.cos(angle) * 5.2;
      hero.x = Math.max(-6.5, Math.min(6.5, fx));
      hero.z = Math.max(-48, Math.min(48, fz));
      hero.mesh.position.set(hero.x, 0, hero.z);
      soundEngine.playFlicker();
      this.sceneManager.spawnShockwave(hero.x, hero.z, 0x38bdf8, 2.5);
    } else if (hero.selectedSpell === 'execute') {
      // True damage execution
      const opponent = hero.team === 'player' ? this.enemy : this.player;
      const dist = Math.hypot(opponent.x - hero.x, opponent.z - hero.z);
      if (dist <= 4.5 && !opponent.isDead) {
        const lostHp = opponent.maxHp - opponent.hp;
        const execDamage = 250 + hero.level * 100 + lostHp * 0.18;
        this.applyDamageToTarget(opponent, execDamage, 'true', hero);
        soundEngine.playHit('true');
        this.sceneManager.spawnShockwave(opponent.x, opponent.z, 0xef4444, 2.8);
      }
    } else if (hero.selectedSpell === 'revitalize') {
      // Heal 25% max HP
      const heal = hero.maxHp * 0.28;
      hero.hp = Math.min(hero.maxHp, hero.hp + heal);
      this.addDamagePopup(`+${Math.round(heal)}`, hero.x, hero.z, '#22c55e');
      this.sceneManager.spawnShockwave(hero.x, hero.z, 0x22c55e, 3.0);
    } else if (hero.selectedSpell === 'flameshot') {
      // Long range missile
      const opponent = hero.team === 'player' ? this.enemy : this.player;
      const dx = opponent.x - hero.x;
      const dz = opponent.z - hero.z;
      const dist = Math.hypot(dx, dz) || 1;
      this.spawnProjectile({
        id: Math.random().toString(),
        team: hero.team,
        sourceType: 'hero',
        x: hero.x,
        y: 1.1,
        z: hero.z,
        targetX: hero.x + (dx / dist) * 16,
        targetY: 1.1,
        targetZ: hero.z + (dz / dist) * 16,
        speed: 22,
        damage: 320 + hero.level * 40,
        damageType: 'magic',
        color: '#f97316',
        radius: 0.4,
      });
    }
  }

  // Trigger Recall to Base
  public triggerRecall(hero: HeroState) {
    if (hero.isDead || hero.isRecalling) return;
    hero.isRecalling = true;
    hero.recallProgress = 0;
  }

  public cancelRecall(hero: HeroState) {
    hero.isRecalling = false;
    hero.recallProgress = 0;
  }

  // Buy Item from Shop
  public buyItem(hero: HeroState, item: Item): boolean {
    const isPlayer = hero.team === 'player';
    const gold = isPlayer ? this.playerGold : this.enemyGold;
    if (gold < item.cost) return false;
    if (hero.inventory.length >= 6) return false;

    if (isPlayer) {
      this.playerGold -= item.cost;
    } else {
      this.enemyGold -= item.cost;
    }

    hero.inventory.push(item);

    // Apply item stats
    if (item.stats.hp) hero.maxHp += item.stats.hp;
    if (item.stats.physicalAttack) hero.physicalAttack += item.stats.physicalAttack;
    if (item.stats.magicPower) hero.magicPower += item.stats.magicPower;
    if (item.stats.armor) hero.armor += item.stats.armor;
    if (item.stats.magicResist) hero.magicResist += item.stats.magicResist;
    if (item.stats.moveSpeed) hero.moveSpeed += item.stats.moveSpeed;
    if (item.stats.attackSpeed) hero.attackSpeed += item.stats.attackSpeed;
    if (item.stats.lifesteal) hero.lifesteal += item.stats.lifesteal;

    soundEngine.playGoldBuy();
    return true;
  }

  // Main 60fps Game Tick Loop
  public tick(dt: number) {
    if (this.isGameOver) return;
    this.gameTime += dt;

    // Passive gold gain (+5 gold every 2 sec)
    this.goldPassiveTimer += dt;
    if (this.goldPassiveTimer >= 2.0) {
      this.goldPassiveTimer = 0;
      this.playerGold += 5;
      this.enemyGold += 5;
    }

    // Minion wave spawning every 24s
    this.minionSpawnTimer += dt;
    if (this.minionSpawnTimer >= 24 || this.gameTime < 1.0) {
      this.minionSpawnTimer = 0.1; // reset
      this.spawnMinionWave();
    }

    // Update Player & Enemy
    this.updateHero(this.player, dt);
    this.updateHero(this.enemy, dt);

    // AI Bot Decision Loop
    this.updateEnemyAI(dt);

    // Update Minions
    this.updateMinions(dt);

    // Update Turrets
    this.updateTurrets(dt);

    // Update Projectiles
    this.updateProjectiles(dt);

    // Update River Crab
    this.updateCrab(dt);

    // Update Visual FX & Camera
    this.sceneManager.updateEffects(dt);
    this.sceneManager.updateCamera(this.player.x, this.player.z, dt);

    // Update Damage Popups
    this.updateDamagePopups(dt);

    // Render 3D Frame
    this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
  }

  private updateHero(hero: HeroState, dt: number) {
    if (hero.isDead) {
      hero.respawnTime -= dt;
      if (hero.respawnTime <= 0) {
        this.respawnHero(hero);
      }
      return;
    }

    // Handle Stun
    if (hero.stunTimer > 0) {
      hero.stunTimer -= dt;
      return;
    }

    // Skill cooldown decay
    for (let i = 0; i < 3; i++) {
      if (hero.skillCooldowns[i] > 0) {
        hero.skillCooldowns[i] = Math.max(0, hero.skillCooldowns[i] - dt);
      }
    }
    if (hero.spellCooldown > 0) {
      hero.spellCooldown = Math.max(0, hero.spellCooldown - dt);
    }

    // Passive Mana and HP regen
    hero.mana = Math.min(hero.maxMana, hero.mana + dt * 4.5);
    hero.hp = Math.min(hero.maxHp, hero.hp + dt * (hero.maxHp * 0.005));

    // Handle Recall
    if (hero.isRecalling) {
      hero.recallProgress += dt;
      if (hero.recallProgress >= 4.0) {
        // Recalled successfully to base!
        const baseZ = hero.team === 'player' ? -42 : 42;
        hero.x = 0;
        hero.z = baseZ;
        hero.mesh.position.set(hero.x, 0, hero.z);
        hero.hp = hero.maxHp;
        hero.mana = hero.maxMana;
        hero.isRecalling = false;
        hero.recallProgress = 0;
        this.sceneManager.spawnShockwave(hero.x, hero.z, 0x22c55e, 3.5);
      }
    }

    // Player Movement handling
    if (hero.team === 'player') {
      if (this.moveVector.x !== 0 || this.moveVector.z !== 0) {
        if (hero.isRecalling) this.cancelRecall(hero);

        const speed = hero.moveSpeed * dt;
        hero.x += this.moveVector.x * speed;
        hero.z += this.moveVector.z * speed;

        // Clamp to arena bounds
        hero.x = Math.max(-6.5, Math.min(6.5, hero.x));
        hero.z = Math.max(-50, Math.min(50, hero.z));

        hero.mesh.position.set(hero.x, 0, hero.z);
        hero.mesh.rotation.y = Math.atan2(this.moveVector.x, this.moveVector.z);
      }
    }

    // Check bush stealth
    let insideBush = false;
    for (const b of this.bushes) {
      if (Math.hypot(hero.x - b.x, hero.z - b.z) <= b.radius) {
        insideBush = true;
        break;
      }
    }
    hero.inBush = insideBush;
  }

  // Enemy Bot AI Logic (Behaves like an MLBB player!)
  private updateEnemyAI(dt: number) {
    const bot = this.enemy;
    if (bot.isDead || bot.stunTimer > 0) return;

    // Auto level up skills if points available
    if (bot.skillPoints > 0) {
      const slot = bot.level >= 4 && bot.skillLevels[2] === 0 ? 2 : bot.skillLevels[0] <= bot.skillLevels[1] ? 0 : 1;
      bot.skillLevels[slot]++;
      bot.skillPoints--;
    }

    // Auto buy items if enemy has enough gold
    const affordableItem = SHOP_ITEMS.find((it) => bot.inventory.length < 6 && this.enemyGold >= it.cost && !bot.inventory.some((i) => i.id === it.id));
    if (affordableItem) {
      this.buyItem(bot, affordableItem);
    }

    const distToPlayer = Math.hypot(this.player.x - bot.x, this.player.z - bot.z);
    const hpPercent = bot.hp / bot.maxHp;

    // 1. Critical Low HP (< 30%): Retreat to base / safe turret
    if (hpPercent < 0.3) {
      const retreatZ = 40; // Behind base turret
      const dz = retreatZ - bot.z;
      if (Math.abs(dz) > 1.0) {
        bot.z += Math.sign(dz) * bot.moveSpeed * dt;
        bot.x = THREE.MathUtils.lerp(bot.x, 0, dt * 2);
        bot.mesh.position.set(bot.x, 0, bot.z);
        bot.mesh.rotation.y = Math.PI;
      } else {
        // Safe under turret: Recall or heal
        if (bot.selectedSpell === 'revitalize' && bot.spellCooldown === 0) {
          this.castBattleSpell(bot);
        } else if (!bot.isRecalling) {
          this.triggerRecall(bot);
        }
      }
      return;
    }

    // 2. Kill Opportunity: Player is low HP -> Combo aggressively!
    if (!this.player.isDead && this.player.hp / this.player.maxHp < 0.45 && distToPlayer <= 8.5) {
      // Cast Execute if available
      if (bot.selectedSpell === 'execute' && bot.spellCooldown === 0 && distToPlayer <= 4.5) {
        this.castBattleSpell(bot);
      }
      // Cast Ultimate
      if (bot.skillCooldowns[2] === 0 && bot.skillLevels[2] > 0) {
        this.castSkill(bot, 2);
      }
      // Cast S1 / S2
      if (bot.skillCooldowns[0] === 0 && bot.skillLevels[0] > 0) {
        this.castSkill(bot, 0);
      }
      if (bot.skillCooldowns[1] === 0 && bot.skillLevels[1] > 0) {
        this.castSkill(bot, 1);
      }
    }

    // 3. Normal Lane Combat & Wave Push
    // Find nearest target: player minions or player hero
    const nearestEnemyMinion = this.minions
      .filter((m) => m.team === 'player')
      .sort((a, b) => Math.hypot(a.x - bot.x, a.z - bot.z) - Math.hypot(b.x - bot.x, b.z - bot.z))[0];

    let targetZ = 0;
    if (nearestEnemyMinion) {
      targetZ = nearestEnemyMinion.z + (bot.isRanged ? 4.5 : 1.5);
    } else if (!this.player.isDead) {
      targetZ = this.player.z + (bot.isRanged ? 5.5 : 2.0);
    } else {
      targetZ = -10; // Push lane towards player base
    }

    // Move towards lane position
    const dz = targetZ - bot.z;
    if (Math.abs(dz) > 0.6) {
      bot.z += Math.sign(dz) * bot.moveSpeed * dt;
      bot.x = THREE.MathUtils.lerp(bot.x, 0, dt * 2);
      bot.mesh.position.set(bot.x, 0, bot.z);
      bot.mesh.rotation.y = dz < 0 ? Math.PI : 0;
    }

    // Harass Player if in range
    if (!this.player.isDead && distToPlayer <= bot.attackRange + 1.5) {
      if (bot.skillCooldowns[0] === 0 && bot.skillLevels[0] > 0 && Math.random() < 0.05) {
        this.castSkill(bot, 0);
      }
      if (bot.skillCooldowns[1] === 0 && bot.skillLevels[1] > 0 && Math.random() < 0.04) {
        this.castSkill(bot, 1);
      }
      // Basic attack
      const now = this.gameTime;
      if (now - bot.lastAttackTime >= 1 / bot.attackSpeed) {
        bot.lastAttackTime = now;
        if (bot.isRanged) {
          this.spawnProjectile({
            id: Math.random().toString(),
            team: 'enemy',
            sourceType: 'hero',
            x: bot.x,
            y: 1.1,
            z: bot.z,
            targetX: this.player.x,
            targetY: 0.8,
            targetZ: this.player.z,
            targetId: 'player',
            speed: 17,
            damage: bot.physicalAttack,
            damageType: 'physical',
            color: bot.config.avatarColor,
            radius: 0.2,
          });
        } else {
          this.applyDamageToTarget(this.player, bot.physicalAttack, 'physical', bot);
        }
      }
    } else if (nearestEnemyMinion && Math.hypot(nearestEnemyMinion.x - bot.x, nearestEnemyMinion.z - bot.z) <= bot.attackRange) {
      // Attack minion
      const now = this.gameTime;
      if (now - bot.lastAttackTime >= 1 / bot.attackSpeed) {
        bot.lastAttackTime = now;
        this.applyDamageToMinion(nearestEnemyMinion, bot.physicalAttack, bot);
      }
    }
  }

  // Spawn Minion Wave (3 minions per side: 2 melee, 1 ranged)
  private spawnMinionWave() {
    const waveTypes: ('melee' | 'melee' | 'ranged')[] = ['melee', 'melee', 'ranged'];
    waveTypes.forEach((type, idx) => {
      // Player Minions (Spawn at Z = -45)
      const pMinion: Minion = {
        id: `p_minion_${Math.random()}`,
        team: 'player',
        type,
        x: (idx - 1) * 1.4,
        z: -44 - idx * 2.0,
        hp: type === 'melee' ? 950 : 650,
        maxHp: type === 'melee' ? 950 : 650,
        attack: type === 'melee' ? 45 : 75,
        attackRange: type === 'melee' ? 1.8 : 5.8,
        attackCooldown: 1.2,
        lastAttackTime: 0,
        moveSpeed: 3.8,
        targetId: null,
        targetType: null,
      };
      this.minions.push(pMinion);
      const pMesh = createMinionMesh(type, 'player');
      pMesh.position.set(pMinion.x, 0, pMinion.z);
      this.sceneManager.scene.add(pMesh);
      this.minionMeshes.set(pMinion.id, pMesh);

      // Enemy Minions (Spawn at Z = +45)
      const eMinion: Minion = {
        id: `e_minion_${Math.random()}`,
        team: 'enemy',
        type,
        x: (idx - 1) * 1.4,
        z: 44 + idx * 2.0,
        hp: type === 'melee' ? 950 : 650,
        maxHp: type === 'melee' ? 950 : 650,
        attack: type === 'melee' ? 45 : 75,
        attackRange: type === 'melee' ? 1.8 : 5.8,
        attackCooldown: 1.2,
        lastAttackTime: 0,
        moveSpeed: 3.8,
        targetId: null,
        targetType: null,
      };
      this.minions.push(eMinion);
      const eMesh = createMinionMesh(type, 'enemy');
      eMesh.position.set(eMinion.x, 0, eMinion.z);
      eMesh.rotation.y = Math.PI;
      this.sceneManager.scene.add(eMesh);
      this.minionMeshes.set(eMinion.id, eMesh);
    });
  }

  // Update Minions Movement & Attacks
  private updateMinions(dt: number) {
    for (let i = this.minions.length - 1; i >= 0; i--) {
      const minion = this.minions[i];
      if (minion.hp <= 0) {
        const mesh = this.minionMeshes.get(minion.id);
        if (mesh) {
          this.sceneManager.scene.remove(mesh);
          this.minionMeshes.delete(minion.id);
        }
        this.minions.splice(i, 1);
        continue;
      }

      // Check opposing targets in range
      const enemyTeam = minion.team === 'player' ? 'enemy' : 'player';
      const opposingMinions = this.minions.filter((m) => m.team === enemyTeam);
      const opposingHero = minion.team === 'player' ? this.enemy : this.player;
      const opposingTurrets = this.turrets.filter((t) => t.team === enemyTeam && !t.isDead);

      // Closest opposing unit
      let nearestTarget: { x: number; z: number; type: string; obj: unknown } | null = null;
      let minDist = 999;

      opposingMinions.forEach((om) => {
        const d = Math.hypot(om.x - minion.x, om.z - minion.z);
        if (d < minDist) {
          minDist = d;
          nearestTarget = { x: om.x, z: om.z, type: 'minion', obj: om };
        }
      });

      if (!nearestTarget && opposingTurrets.length > 0) {
        const t = opposingTurrets[0];
        const d = Math.hypot(t.x - minion.x, t.z - minion.z);
        if (d < minDist) {
          minDist = d;
          nearestTarget = { x: t.x, z: t.z, type: 'turret', obj: t };
        }
      }

      if (nearestTarget && minDist <= minion.attackRange) {
        // Attack target
        if (this.gameTime - minion.lastAttackTime >= minion.attackCooldown) {
          minion.lastAttackTime = this.gameTime;
          if (nearestTarget.type === 'minion') {
            this.applyDamageToMinion(nearestTarget.obj as Minion, minion.attack, minion);
          } else if (nearestTarget.type === 'turret') {
            this.applyDamageToTurret(nearestTarget.obj as Turret, minion.attack);
          }
        }
      } else {
        // March down the lane towards enemy base
        const dir = minion.team === 'player' ? 1 : -1;
        minion.z += dir * minion.moveSpeed * dt;
        const mesh = this.minionMeshes.get(minion.id);
        if (mesh) {
          mesh.position.set(minion.x, 0, minion.z);
          mesh.rotation.y = dir === 1 ? 0 : Math.PI;
        }
      }
    }
  }

  // Update Turrets (Target minions first, protect friendly heroes from dives)
  private updateTurrets(dt: number) {
    this.turrets.forEach((turret) => {
      if (turret.isDead) return;

      const enemyTeam = turret.team === 'player' ? 'enemy' : 'player';
      const enemyHero = turret.team === 'player' ? this.enemy : this.player;

      // Find targets in attack range
      const inRangeMinions = this.minions.filter((m) => m.team === enemyTeam && Math.hypot(m.x - turret.x, m.z - turret.z) <= turret.attackRange);
      const heroDist = Math.hypot(enemyHero.x - turret.x, enemyHero.z - turret.z);
      const isHeroInRange = !enemyHero.isDead && heroDist <= turret.attackRange;

      // Prioritize target: minion first, unless hero attacked friendly hero
      let chosenTarget: { x: number; z: number; type: 'minion' | 'hero'; obj: Minion | HeroState } | null = null;
      if (inRangeMinions.length > 0) {
        chosenTarget = { x: inRangeMinions[0].x, z: inRangeMinions[0].z, type: 'minion', obj: inRangeMinions[0] };
      } else if (isHeroInRange) {
        chosenTarget = { x: enemyHero.x, z: enemyHero.z, type: 'hero', obj: enemyHero };
      }

      if (chosenTarget && this.gameTime - turret.lastAttackTime >= 1.25) {
        turret.lastAttackTime = this.gameTime;
        soundEngine.playTurretShot();

        // Spawn turret laser shot
        this.spawnProjectile({
          id: Math.random().toString(),
          team: turret.team,
          sourceType: 'turret',
          x: turret.x,
          y: 4.2,
          z: turret.z,
          targetX: chosenTarget.x,
          targetY: 1.0,
          targetZ: chosenTarget.z,
          speed: 16,
          damage: turret.attack,
          damageType: 'physical',
          color: turret.team === 'player' ? '#38bdf8' : '#ef4444',
          radius: 0.35,
        });
      }
    });
  }

  // Update Projectiles
  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const dx = p.targetX - p.x;
      const dz = p.targetZ - p.z;
      const dist = Math.hypot(dx, dz);
      const step = p.speed * dt;

      if (dist <= step || dist < 0.3) {
        // Impact
        this.resolveProjectileHit(p);
        const mesh = this.projectileMeshes.get(p.id);
        if (mesh) {
          this.sceneManager.scene.remove(mesh);
          this.projectileMeshes.delete(p.id);
        }
        this.projectiles.splice(i, 1);
      } else {
        p.x += (dx / dist) * step;
        p.z += (dz / dist) * step;
        const mesh = this.projectileMeshes.get(p.id);
        if (mesh) {
          mesh.position.set(p.x, p.y, p.z);
        }
      }
    }
  }

  private spawnProjectile(p: Projectile) {
    this.projectiles.push(p);
    const geo = new THREE.SphereGeometry(p.radius, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: p.color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(p.x, p.y, p.z);
    this.sceneManager.scene.add(mesh);
    this.projectileMeshes.set(p.id, mesh);
  }

  private resolveProjectileHit(p: Projectile) {
    soundEngine.playHit(p.damageType);

    if (p.targetId === 'player') {
      this.applyDamageToTarget(this.player, p.damage, p.damageType);
    } else if (p.targetId === 'enemy') {
      this.applyDamageToTarget(this.enemy, p.damage, p.damageType);
    } else if (p.targetId === 'river_crab') {
      this.crab.hp -= p.damage;
      this.addDamagePopup(`${Math.round(p.damage)}`, this.crab.x, this.crab.z, '#fde047');
      if (this.crab.hp <= 0 && !this.crab.isDead) {
        this.crab.isDead = true;
        this.crab.respawnTimer = 60;
        this.crabMesh.visible = false;
        if (p.team === 'player') {
          this.playerGold += 60;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.2);
          this.pushAnnouncement('River Crab Slain!', '+60 Gold & 20% HP Recovered', 'system', '#22c55e');
        }
      }
    } else if (p.targetId === 'nexus') {
      const oppNexus = this.nexuses.find((n) => n.team !== p.team);
      if (oppNexus) this.applyDamageToNexus(oppNexus, p.damage);
    } else if (p.targetId) {
      // Check minion or turret
      const minion = this.minions.find((m) => m.id === p.targetId);
      if (minion) {
        this.applyDamageToMinion(minion, p.damage);
      } else {
        const turret = this.turrets.find((t) => t.id === p.targetId);
        if (turret) {
          this.applyDamageToTurret(turret, p.damage);
        }
      }
    } else {
      // Area or hero proximity check
      const opponent = p.team === 'player' ? this.enemy : this.player;
      if (Math.hypot(opponent.x - p.targetX, opponent.z - p.targetZ) <= 1.8) {
        this.applyDamageToTarget(opponent, p.damage, p.damageType);
      }
    }
  }

  // Update River Crab
  private updateCrab(dt: number) {
    if (this.crab.isDead) {
      this.crab.respawnTimer -= dt;
      if (this.crab.respawnTimer <= 0) {
        this.crab.isDead = false;
        this.crab.hp = this.crab.maxHp;
        this.crabMesh.visible = true;
      }
    } else {
      // Gentle crab idle bobbing
      this.crabMesh.rotation.y += dt * 0.5;
    }
  }

  // Damage Calculations & Popups
  public applyDamageToTarget(target: HeroState, rawDamage: number, damageType: 'physical' | 'magic' | 'true', attacker?: HeroState) {
    if (target.isDead) return;

    let finalDamage = rawDamage;
    if (damageType === 'physical') {
      finalDamage = rawDamage * (100 / (100 + target.armor));
    } else if (damageType === 'magic') {
      finalDamage = rawDamage * (100 / (100 + target.magicResist));
    }

    target.hp = Math.max(0, target.hp - finalDamage);

    // Lifesteal
    if (attacker && attacker.lifesteal > 0 && damageType === 'physical') {
      const heal = finalDamage * attacker.lifesteal;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
      this.addDamagePopup(`+${Math.round(heal)}`, attacker.x, attacker.z, '#22c55e');
    }

    const color = damageType === 'physical' ? '#f97316' : damageType === 'magic' ? '#c084fc' : '#ffffff';
    this.addDamagePopup(`${Math.round(finalDamage)}`, target.x, target.z, color);

    if (target.hp <= 0) {
      this.handleHeroDeath(target, attacker);
    }
  }

  public applyDamageToMinion(minion: Minion, damage: number, attacker?: HeroState | Minion) {
    minion.hp -= damage;
    this.addDamagePopup(`${Math.round(damage)}`, minion.x, minion.z, '#fde047');
    if (minion.hp <= 0 && attacker && 'team' in attacker && attacker.team === 'player') {
      // Minion last hit reward: +65 gold + 70 XP
      this.playerGold += 65;
      this.addXp(this.player, 75);
    }
  }

  public applyDamageToTurret(turret: Turret, damage: number) {
    if (turret.isDead) return;
    turret.hp = Math.max(0, turret.hp - damage);
    this.addDamagePopup(`${Math.round(damage)}`, turret.x, turret.z, '#e2e8f0');

    if (turret.hp <= 0) {
      turret.isDead = true;
      const mesh = this.turretMeshes.get(turret.id);
      if (mesh) mesh.visible = false;
      this.sceneManager.spawnShockwave(turret.x, turret.z, 0xef4444, 6.0);
      this.sceneManager.triggerCameraShake(0.8);

      const msg = turret.team === 'player' ? 'Our Turret has been destroyed!' : 'Enemy Turret has been destroyed!';
      this.pushAnnouncement(msg, '+200 Team Gold', 'turret', '#f59e0b');
      soundEngine.announce(msg);

      if (turret.team === 'enemy') {
        this.playerGold += 200;
        this.addXp(this.player, 250);
      } else {
        this.enemyGold += 200;
      }
    }
  }

  public applyDamageToNexus(nexus: BaseNexus, damage: number) {
    if (nexus.isDead || this.isGameOver) return;
    nexus.hp = Math.max(0, nexus.hp - damage);
    this.addDamagePopup(`${Math.round(damage)}`, nexus.x, nexus.z, '#ef4444');

    if (nexus.hp <= 0) {
      nexus.isDead = true;
      this.isGameOver = true;
      this.winner = nexus.team === 'player' ? 'enemy' : 'player';
      this.sceneManager.spawnShockwave(nexus.x, nexus.z, 0xef4444, 10.0);
      this.sceneManager.triggerCameraShake(1.2);

      if (this.winner === 'player') {
        this.pushAnnouncement('VICTORY!', 'Enemy Base Destroyed!', 'kill', '#22c55e');
        soundEngine.playVictory();
        soundEngine.announce('Victory!');
      } else {
        this.pushAnnouncement('DEFEAT!', 'Our Base was Destroyed!', 'kill', '#ef4444');
        soundEngine.playDefeat();
        soundEngine.announce('Defeat!');
      }
    }
  }

  private handleHeroDeath(victim: HeroState, killer?: HeroState) {
    victim.isDead = true;
    victim.mesh.visible = false;
    victim.respawnTime = 8 + victim.level * 2; // Respawn scale

    if (victim.team === 'player') {
      this.playerDeaths++;
      this.enemyKills++;
      this.enemyGold += 300;
      this.addXp(this.enemy, 400);

      this.pushAnnouncement('An ally has been slain!', `${this.enemy.config.name} killed you`, 'kill', '#ef4444');
      soundEngine.announce('An ally has been slain!');
    } else {
      this.enemyDeaths++;
      this.playerKills++;
      this.playerGold += 300;
      this.addXp(this.player, 400);

      if (!this.firstBloodClaimed) {
        this.firstBloodClaimed = true;
        this.pushAnnouncement('FIRST BLOOD!', 'You drew first blood!', 'multikill', '#ef4444');
        soundEngine.announce('First Blood!');
      } else {
        const killStreakMsg = this.playerKills >= 5 ? 'LEGENDARY!' : this.playerKills >= 3 ? 'KILLING SPREE!' : 'You have slain an enemy!';
        this.pushAnnouncement(killStreakMsg, 'Shut down the rival hero!', 'kill', '#22c55e');
        soundEngine.announce(killStreakMsg);
      }
    }
  }

  private respawnHero(hero: HeroState) {
    hero.isDead = false;
    hero.mesh.visible = true;
    const baseZ = hero.team === 'player' ? -42 : 42;
    hero.x = 0;
    hero.z = baseZ;
    hero.mesh.position.set(hero.x, 0, hero.z);
    hero.hp = hero.maxHp;
    hero.mana = hero.maxMana;
    this.sceneManager.spawnShockwave(hero.x, hero.z, 0x38bdf8, 3.5);
  }

  public addXp(hero: HeroState, amount: number) {
    hero.xp += amount;
    if (hero.xp >= hero.nextLevelXp && hero.level < 15) {
      hero.level++;
      hero.xp -= hero.nextLevelXp;
      hero.nextLevelXp = Math.round(hero.nextLevelXp * 1.35);
      hero.skillPoints++;

      // Stats growth
      hero.maxHp += hero.config.growth.hp;
      hero.hp += hero.config.growth.hp;
      hero.physicalAttack += hero.config.growth.physicalAttack;
      hero.magicPower += hero.config.growth.magicPower;
      hero.armor += hero.config.growth.armor;

      if (hero.team === 'player') {
        soundEngine.playLevelUp();
        this.sceneManager.spawnLevelUpEffect(hero.mesh);
        this.pushAnnouncement(`LEVEL ${hero.level}!`, 'Skill point available to upgrade', 'system', '#facc15');
      }
    }
  }

  private dealAoEDamage(x: number, z: number, radius: number, damage: number, damageType: 'physical' | 'magic' | 'true', attacker: HeroState, stunDuration?: number, pullToAttacker?: boolean) {
    const opponent = attacker.team === 'player' ? this.enemy : this.player;
    const d = Math.hypot(opponent.x - x, opponent.z - z);
    if (d <= radius && !opponent.isDead) {
      this.applyDamageToTarget(opponent, damage, damageType, attacker);
      if (stunDuration) {
        opponent.stunTimer = stunDuration;
        this.addDamagePopup('STUNNED!', opponent.x, opponent.z, '#60a5fa');
      }
      if (pullToAttacker) {
        // Tigreal Ult Pull
        opponent.x = attacker.x + (opponent.x - attacker.x) * 0.3;
        opponent.z = attacker.z + (opponent.z - attacker.z) * 0.3;
        opponent.mesh.position.set(opponent.x, 0, opponent.z);
      }
    }

    // Damage minions in AoE
    const oppTeam = attacker.team === 'player' ? 'enemy' : 'player';
    this.minions.forEach((m) => {
      if (m.team === oppTeam && Math.hypot(m.x - x, m.z - z) <= radius) {
        this.applyDamageToMinion(m, damage, attacker);
      }
    });
  }

  private dealLineDamage(startX: number, startZ: number, dirX: number, dirZ: number, maxDist: number, width: number, damage: number, damageType: 'physical' | 'magic' | 'true', attacker: HeroState) {
    const opponent = attacker.team === 'player' ? this.enemy : this.player;
    // Check if opponent is along ray within width
    const toOppX = opponent.x - startX;
    const toOppZ = opponent.z - startZ;
    const proj = toOppX * dirX + toOppZ * dirZ;
    if (proj > 0 && proj <= maxDist) {
      const perpDist = Math.abs(toOppX * -dirZ + toOppZ * dirX);
      if (perpDist <= width / 2 && !opponent.isDead) {
        this.applyDamageToTarget(opponent, damage, damageType, attacker);
      }
    }

    // Minions along line
    const oppTeam = attacker.team === 'player' ? 'enemy' : 'player';
    this.minions.forEach((m) => {
      if (m.team === oppTeam) {
        const mx = m.x - startX;
        const mz = m.z - startZ;
        const p = mx * dirX + mz * dirZ;
        if (p > 0 && p <= maxDist) {
          const perp = Math.abs(mx * -dirZ + mz * dirX);
          if (perp <= width / 2) {
            this.applyDamageToMinion(m, damage, attacker);
          }
        }
      }
    });
  }

  private findAttackTarget(hero: HeroState): { x: number; z: number; id: string; type: string } | null {
    const enemyTeam = hero.team === 'player' ? 'enemy' : 'player';
    const opponent = hero.team === 'player' ? this.enemy : this.player;

    // 1. Enemy hero in attack range
    const heroDist = Math.hypot(opponent.x - hero.x, opponent.z - hero.z);
    if (!opponent.isDead && (!opponent.inBush || hero.inBush) && heroDist <= hero.attackRange) {
      return { x: opponent.x, z: opponent.z, id: opponent.team, type: 'hero' };
    }

    // 2. Enemy minion in range
    const oppMinions = this.minions.filter((m) => m.team === enemyTeam && Math.hypot(m.x - hero.x, m.z - hero.z) <= hero.attackRange);
    if (oppMinions.length > 0) {
      oppMinions.sort((a, b) => a.hp - b.hp); // Target lowest HP minion to last hit!
      return { x: oppMinions[0].x, z: oppMinions[0].z, id: oppMinions[0].id, type: 'minion' };
    }

    // 3. Enemy turret in range
    const oppTurrets = this.turrets.filter((t) => t.team === enemyTeam && !t.isDead && Math.hypot(t.x - hero.x, t.z - hero.z) <= hero.attackRange);
    if (oppTurrets.length > 0) {
      return { x: oppTurrets[0].x, z: oppTurrets[0].z, id: oppTurrets[0].id, type: 'turret' };
    }

    // 4. Enemy nexus in range
    const oppNexus = this.nexuses.find((n) => n.team === enemyTeam && !n.isDead && Math.hypot(n.x - hero.x, n.z - hero.z) <= hero.attackRange + 2.0);
    if (oppNexus) {
      return { x: oppNexus.x, z: oppNexus.z, id: 'nexus', type: 'nexus' };
    }

    // 5. River crab in range
    if (!this.crab.isDead && Math.hypot(this.crab.x - hero.x, this.crab.z - hero.z) <= hero.attackRange) {
      return { x: this.crab.x, z: this.crab.z, id: 'river_crab', type: 'crab' };
    }

    return null;
  }

  public addDamagePopup(text: string, x: number, z: number, color: string) {
    this.damagePopups.push({
      id: Math.random().toString(),
      text,
      x: x + (Math.random() - 0.5) * 0.8,
      y: 1.8 + Math.random() * 0.4,
      z,
      color,
      duration: 0.85,
      elapsed: 0,
    });
  }

  private updateDamagePopups(dt: number) {
    for (let i = this.damagePopups.length - 1; i >= 0; i--) {
      const p = this.damagePopups[i];
      p.elapsed += dt;
      p.y += dt * 1.5; // Float upwards
      if (p.elapsed >= p.duration) {
        this.damagePopups.splice(i, 1);
      }
    }
  }

  public pushAnnouncement(text: string, subtext: string | undefined, type: Announcement['type'], color: string) {
    const ann: Announcement = {
      id: Math.random().toString(),
      text,
      subtext,
      type,
      color,
      timestamp: Date.now(),
    };
    this.announcements.unshift(ann);
    if (this.announcements.length > 4) this.announcements.pop();
  }

  public dispose() {
    this.sceneManager.dispose();
  }
}
