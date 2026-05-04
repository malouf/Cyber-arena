export type SoulId = "onde" | "fury" | "aegis";

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
  target: { x: number; y: number };
  ability?: Ability;
  paCost: number;
  pmCost: number;
  manaCost: number;
  name: string;
  initiative: number;
  entity?: "player" | "enemy";
};
