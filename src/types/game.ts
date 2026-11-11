export type HeroId = 'layla' | 'tigreal' | 'eudora' | 'alucard' | 'miya';

export type HeroRole = 'Marksman' | 'Tank/Fighter' | 'Mage' | 'Assassin/Fighter';

export type SkillSlot = 1 | 2 | 3; // 1 = S1, 2 = S2, 3 = Ultimate

export interface SkillDefinition {
  slot: SkillSlot;
  name: string;
  nameId: string; // Indonesian / MLBB style name
  cooldown: number; // in seconds
  manaCost: number;
  damage: number;
  damageScaling: number; // ratio of physical or magic attack
  damageType: 'physical' | 'magic' | 'true';
  range: number;
  type: 'projectile' | 'aoe' | 'dash' | 'beam' | 'buff' | 'target_stun';
  description: string;
  iconColor: string;
  hotkey: string;
}

export type BattleSpellId = 'flicker' | 'execute' | 'flameshot' | 'revitalize' | 'sprint';

export interface BattleSpell {
  id: BattleSpellId;
  name: string;
  cooldown: number;
  description: string;
  iconColor: string;
}

export interface Item {
  id: string;
  name: string;
  cost: number;
  description: string;
  stats: {
    physicalAttack?: number;
    magicPower?: number;
    hp?: number;
    armor?: number;
    magicResist?: number;
    attackSpeed?: number;
    lifesteal?: number;
    moveSpeed?: number;
    cooldownReduction?: number;
  };
  iconEmoji: string;
}

export interface HeroConfig {
  id: HeroId;
  name: string;
  title: string;
  role: HeroRole;
  avatarColor: string;
  secondaryColor: string;
  baseStats: {
    maxHp: number;
    maxMana: number;
    physicalAttack: number;
    magicPower: number;
    armor: number;
    magicResist: number;
    moveSpeed: number; // units per sec
    attackRange: number; // units
    attackSpeed: number; // attacks per sec
    isRanged: boolean;
  };
  growth: {
    hp: number;
    physicalAttack: number;
    magicPower: number;
    armor: number;
  };
  passive: {
    name: string;
    description: string;
  };
  skills: SkillDefinition[];
}

export type Team = 'player' | 'enemy';

export interface DamagePopup {
  id: string;
  text: string;
  x: number;
  y: number;
  z: number;
  color: string;
  isCrit?: boolean;
  duration: number;
  elapsed: number;
}

export interface Minion {
  id: string;
  team: Team;
  type: 'melee' | 'ranged';
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  attack: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  moveSpeed: number;
  targetId: string | null;
  targetType: 'minion' | 'hero' | 'turret' | 'base' | null;
}

export interface Turret {
  id: string;
  team: Team;
  tier: 1 | 2; // 1 = Outer, 2 = Base Turret
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  attack: number;
  attackRange: number;
  lastAttackTime: number;
  targetId: string | null;
  targetType: 'minion' | 'hero' | null;
  isDead: boolean;
}

export interface BaseNexus {
  team: Team;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  isDead: boolean;
}

export interface JungleCreep {
  id: string;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  attack: number;
  attackRange: number;
  isDead: boolean;
  respawnTimer: number;
}

export interface Projectile {
  id: string;
  team: Team;
  sourceType: 'hero' | 'minion' | 'turret';
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  targetId?: string;
  speed: number;
  damage: number;
  damageType: 'physical' | 'magic' | 'true';
  color: string;
  radius: number;
  pierce?: boolean;
  onHitEffect?: string;
}

export interface HeroState {
  config: HeroConfig;
  team: Team;
  level: number;
  xp: number;
  nextLevelXp: number;
  skillPoints: number;
  skillLevels: [number, number, number]; // [S1, S2, S3] levels
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  physicalAttack: number;
  magicPower: number;
  armor: number;
  magicResist: number;
  moveSpeed: number;
  attackRange: number;
  attackSpeed: number;
  isRanged: boolean;
  lifesteal: number;
  isDead: boolean;
  respawnTime: number;
  x: number;
  z: number;
  mesh: any; // THREE.Group
  skillCooldowns: [number, number, number]; // remaining cooldowns
  spellCooldown: number;
  selectedSpell: BattleSpellId;
  lastAttackTime: number;
  isRecalling: boolean;
  recallProgress: number; // 0 to 4 seconds
  isStealthed: boolean;
  inBush: boolean;
  stunTimer: number;
  inventory: Item[];
}

export interface Announcement {
  id: string;
  text: string;
  subtext?: string;
  type: 'kill' | 'multikill' | 'shutdown' | 'turret' | 'system' | 'welcome';
  color: string;
  timestamp: number;
}
