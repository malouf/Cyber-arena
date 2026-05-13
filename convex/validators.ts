import { v } from "convex/values";

export const posValidator = v.object({
  x: v.number(),
  y: v.number(),
});

export const playerLoadoutValidator = v.object({
  primarySoul: v.string(),
  secondarySoul: v.string(),
  slots: v.array(
    v.union(
      v.object({ kind: v.literal("elite"), abilityId: v.string() }),
      v.object({ kind: v.literal("active"), abilityId: v.string() }),
      v.object({ kind: v.literal("passive"), passiveId: v.string() }),
    ),
  ),
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
  bonusPa: v.optional(v.number()),
  bonusPm: v.optional(v.number()),
  pos: posValidator,
  passives: v.array(v.string()),
  loadout: playerLoadoutValidator,
  effects: v.array(v.any()),
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
  abilityType: v.optional(
    v.union(
      v.literal("attack"),
      v.literal("move_attack"),
      v.literal("trap"),
      v.literal("buff"),
      v.literal("control"),
    ),
  ),
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
  v.object({
    type: v.literal("mitigation"),
    entity: v.string(),
    amount: v.number(),
    source: v.string(),
  }),
  v.object({
    type: v.literal("healing"),
    entity: v.string(),
    amount: v.number(),
    source: v.string(),
  }),
  v.object({
    type: v.literal("resource_change"),
    entity: v.string(),
    resource: v.union(v.literal("pa"), v.literal("pm"), v.literal("mana")),
    amount: v.number(),
    reason: v.string(),
  }),
);

export const playerStateInMatchValidator = v.object({
  clientId: v.string(),
  name: v.string(),
  state: entityStateValidator,
  slot: v.string(),
});

export const mapObjectValidator = v.object({
  type: v.union(
    v.literal("hp_pack"),
    v.literal("mana_pack"),
    v.literal("pa_boost"),
    v.literal("pm_boost"),
    v.literal("hp"),
    v.literal("mana"),
    v.literal("buff"),
    v.literal("wall"),
  ),
  pos: posValidator,
  value: v.number(),
  collected: v.boolean(),
  duration: v.optional(v.number()),
});
