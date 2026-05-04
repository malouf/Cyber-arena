import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const posValidator = v.object({
  x: v.number(),
  y: v.number(),
});

const playerLoadoutValidator = v.object({
  primarySoul: v.string(),
  secondarySoul: v.string(),
  selectedActives: v.array(v.string()),
  selectedPassives: v.array(v.string()),
  items: v.array(v.string()),
});

const entityStateValidator = v.object({
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

const validatedActionValidator = v.object({
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

const combatEventValidator = v.union(
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

const playerStateInMatchValidator = v.object({
  clientId: v.string(),
  name: v.string(),
  state: entityStateValidator,
  slot: v.string(),
});

const mapObjectValidator = v.object({
  type: v.union(v.literal("hp"), v.literal("mana"), v.literal("buff")),
  pos: posValidator,
  value: v.number(),
  collected: v.boolean(),
});

export default defineSchema({
  users: defineTable({
    clientId: v.string(),
    displayName: v.string(),
    skins: v.array(v.string()),
    equippedSkin: v.optional(v.string()),
    xp: v.number(),
    level: v.number(),
    battlePassPremium: v.boolean(),
    pushToken: v.optional(v.string()),
  }).index("by_clientId", ["clientId"]),

  matchmakingQueue: defineTable({
    clientId: v.string(),
    displayName: v.string(),
    primarySoul: v.string(),
    secondarySoul: v.string(),
    selectedActives: v.array(v.string()),
    selectedPassives: v.array(v.string()),
    items: v.array(v.string()),
    mode: v.union(v.literal("1v1"), v.literal("3v3")),
    createdAt: v.number(),
  })
    .index("by_clientId", ["clientId"])
    .index("by_mode", ["mode"]),

  matches: defineTable({
    status: v.union(v.literal("active"), v.literal("completed")),
    phase: v.union(v.literal("planning"), v.literal("waiting_for_submissions")),
    mode: v.union(v.literal("1v1"), v.literal("3v3")),
    turnNumber: v.number(),
    players: v.array(playerStateInMatchValidator),
    mapObjects: v.array(mapObjectValidator),
    winner: v.union(v.string(), v.literal("draw"), v.null()),
    lastResolvedTurn: v.number(),
    lastActivityAt: v.number(),
    timeoutMs: v.number(),
    type: v.union(v.literal("casual"), v.literal("strategic")),
  }).index("by_status", ["status"]),

  turnSubmissions: defineTable({
    matchId: v.id("matches"),
    turnNumber: v.number(),
    playerSlot: v.string(),
    queue: v.array(validatedActionValidator),
    submittedAt: v.number(),
  })
    .index("by_matchId_and_turnNumber", ["matchId", "turnNumber"])
    .index("by_matchId_and_turnNumber_and_playerSlot", [
      "matchId",
      "turnNumber",
      "playerSlot",
    ]),

  matchEvents: defineTable({
    matchId: v.id("matches"),
    turnNumber: v.number(),
    events: v.array(combatEventValidator),
    createdAt: v.number(),
  }).index("by_matchId_and_turnNumber", ["matchId", "turnNumber"]),

  chat: defineTable({
    matchId: v.union(v.id("matches"), v.literal("global")),
    senderId: v.string(),
    senderName: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_matchId", ["matchId"]),

  analytics: defineTable({
    matchId: v.id("matches"),
    playerSlot: v.string(),
    damageDealt: v.number(),
    damageTaken: v.number(),
    healingDone: v.number(),
    shieldingDone: v.number(),
    interrupts: v.number(),
    abilityBreakdown: v.record(v.string(), v.number()),
  }).index("by_matchId", ["matchId"]),
});
