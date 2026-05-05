export type SoulId = "onde" | "fury" | "aegis";

export type Pos = { x: number; y: number };

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
};

export type Passive = {
  id: string;
  name: string;
  desc: string;
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
};

export type CombatEvent =
  | { type: "log"; text: string }
  | { type: "effect"; text: string; color: string; pos: Pos }
  | { type: "move"; entity: "player" | "enemy"; pos: Pos }
  | {
      type: "stats";
      entity: "player" | "enemy";
      hp?: number;
      pa?: number;
      pm?: number;
      mana?: number;
    }
  | { type: "delay"; ms: number };

export type TurnState = {
  cooldowns: Record<string, number>;
  usesThisTurn: Record<string, number>;
  flowStateRange: number;
  bonusPa: number;
};
