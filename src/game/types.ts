export type SoulId = "onde" | "fury" | "aegis" | "umbra" | "verdant" | "volt";

export type Pos = { x: number; y: number };

export type StatusEffectType =
  | "stun"
  | "dot"
  | "shield"
  | "buff"
  | "debuff"
  | "root"
  | "stealth";

export type StatusEffect = {
  id: string;
  type: StatusEffectType;
  name: string;
  duration: number; // turns
  value?: number;
};

export type Ability = {
  id: string;
  name: string;
  paCost: number;
  pmCost: number;
  manaCost: number;
  range: number;
  damage: number;
  type: "attack" | "move_attack" | "trap" | "buff" | "control";
  desc: string;
  initiative: number;
  cooldown?: number;
  maxUsesPerTurn?: number;
  effect?: StatusEffect;
};

export type Passive = {
  id: string;
  name: string;
  desc: string;
  effect?:
    | "masochism"
    | "momentum"
    | "drain_force"
    | "flow_state"
    | "thorns"
    | "heavy_plating"
    | "opportunist"
    | "shadow_step"
    | "root_system"
    | "supercharged"
    | "conductivity";
};

export type Soul = {
  id: SoulId;
  name: string;
  role: string;
  baseStats: { hp: number; pa: number; pm: number; mana: number };
  baseAttack: Ability;
  ultimate: Ability;
  actives: Array<Ability>;
  passives: Array<Passive>;
};

export type Action = {
  type: "move" | "ability";
  target: Pos;
  ability?: Ability;
  paCost: number;
  pmCost: number;
  manaCost: number;
  name: string;
  initiative: number;
  entity?: "player" | "enemy";
};

export type LoadoutSlot =
  | { kind: "elite"; ability: Ability }
  | { kind: "active"; ability: Ability }
  | { kind: "passive"; passive: Passive };

export type EntityState = {
  id: "player" | "enemy";
  hp: number;
  maxHp: number;
  pa: number;
  maxPa: number;
  pm: number;
  maxPm: number;
  mana: number;
  maxMana: number;
  pos: Pos;
  passives: Array<string>;
  loadout: Array<LoadoutSlot>;
  effects: Array<StatusEffect>;
};

export type InteractableType =
  | "mana_well"
  | "item"
  | "trap"
  | "wall"
  | "hp_pack"
  | "mana_pack"
  | "pa_boost"
  | "pm_boost";

export type Interactable = {
  id: string;
  type: InteractableType;
  pos: Pos;
  duration: number;
  value: number;
  ownerId?: "player" | "enemy";
  triggeredBy?: "player" | "enemy" | "both";
};

export type CombatEvent =
  | { type: "log"; text: string }
  | {
      type: "effect";
      text: string;
      color: string;
      pos: Pos;
      target?: "player" | "enemy";
    }
  | { type: "move"; entity: "player" | "enemy"; pos: Pos }
  | {
      type: "stats";
      entity: "player" | "enemy";
      hp?: number;
      pa?: number;
      pm?: number;
      mana?: number;
    }
  | {
      type: "attack";
      entity: "player" | "enemy";
      target: Pos;
      hit: boolean;
      damage: number;
      abilityName?: string;
    }
  | { type: "delay"; ms: number }
  | {
      type: "interact";
      entity: "player" | "enemy";
      interactableId: string;
      interactableType: InteractableType;
    }
  | { type: "rest_triggered"; entity: "player" | "enemy" }
  | {
      type: "mitigation";
      entity: "player" | "enemy";
      amount: number;
      source: string;
    }
  | {
      type: "healing";
      entity: "player" | "enemy";
      amount: number;
      source: string;
    }
  | {
      type: "resource_change";
      entity: "player" | "enemy";
      resource: "pa" | "pm" | "mana";
      amount: number;
      reason: string;
    };

export type TurnState = {
  cooldowns: Record<string, number>;
  usesThisTurn: Record<string, number>;
  flowStateRange: number;
  bonusPa: number;
  bonusPm: number;
  isRestTurn: boolean;
};

export type TurnStats = {
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  shieldingDone?: number;
  manaSpent: number;
  actionsExecuted: number;
  distanceMoved: number;
  damageMitigated: number;
  interrupts?: number;
  abilityBreakdown: Record<string, number>;
};

export type CombatStats = {
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalHealingDone: number;
  totalShieldingDone?: number;
  totalManaSpent: number;
  totalActionsExecuted: number;
  totalDistanceMoved: number;
  totalDamageMitigated: number;
  totalInterrupts?: number;
  resourceEfficiency?: number;
  turnCount: number;
  dps: number;
  effectiveDamage: number;
  abilityBreakdown: Record<string, number>;
};
