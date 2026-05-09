import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  combatEventValidator,
  mapObjectValidator,
  playerStateInMatchValidator,
  validatedActionValidator,
} from "./validators";

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
    slots: v.array(
      v.union(
        v.object({ kind: v.literal("elite"), abilityId: v.string() }),
        v.object({ kind: v.literal("active"), abilityId: v.string() }),
        v.object({ kind: v.literal("passive"), passiveId: v.string() }),
      ),
    ),
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
    damageMitigated: v.number(),
    resourceEfficiency: v.number(),
    interrupts: v.number(),
    abilityBreakdown: v.record(v.string(), v.number()),
  }).index("by_matchId", ["matchId"]),
});
