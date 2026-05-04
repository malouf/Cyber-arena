import { v } from "convex/values";

export const posValidator = v.object({
  x: v.number(),
  y: v.number(),
});

export const playerLoadoutValidator = v.object({
  primarySoul: v.string(),
  secondarySoul: v.string(),
  selectedActives: v.array(v.string()),
  selectedPassives: v.array(v.string()),
  items: v.array(v.string()),
});

export const entityStateValidator = v.object({
  hp: v.number(),
  maxHp: v.number(),
  pa: v.number(),
  maxPa: v.number(),
  pm: v.number(),
  maxPm: v.number(),
  mana: v.number(),
  maxMana: v.number(),
  pos: posValidator,
  passives: v.array(v.string()),
  loadout: playerLoadoutValidator,
});

export const validatedActionValidator = v.object({
  type: v.union(v.literal("move"), v.literal("ability")),
  target: posValidator,
  initiative: v.number(),
  paCost: v.number(),
  pmCost: v.number(),
  manaCost: v.number(),
  damage: v.number(),
  range: v.number(),
  name: v.string(),
  abilityId: v.optional(v.string()),
});

export const combatEventValidator = v.union(
  v.object({
    type: v.literal("log"),
    text: v.string(),
  }),
  v.object({
    type: v.literal("move"),
    entity: v.string(),
    pos: posValidator,
  }),
  v.object({
    type: v.literal("attack"),
    entity: v.string(),
    target: posValidator,
    hit: v.boolean(),
    damage: v.number(),
    abilityName: v.optional(v.string()),
  }),
  v.object({
    type: v.literal("stats"),
    entity: v.string(),
    hp: v.optional(v.number()),
    pa: v.optional(v.number()),
    pm: v.optional(v.number()),
    mana: v.optional(v.number()),
  }),
  v.object({
    type: v.literal("effect"),
    text: v.string(),
    color: v.string(),
    pos: posValidator,
  }),
);

export const playerStateInMatchValidator = v.object({
  clientId: v.string(),
  name: v.string(),
  state: entityStateValidator,
  slot: v.string(),
});

export const mapObjectValidator = v.object({
  type: v.union(v.literal("hp"), v.literal("mana"), v.literal("buff")),
  pos: posValidator,
  value: v.number(),
  collected: v.boolean(),
});
