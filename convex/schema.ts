import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const posValidator = v.object({
  x: v.number(),
  y: v.number(),
})

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
})

const validatedActionValidator = v.object({
  type: v.union(v.literal('move'), v.literal('basic_attack')),
  target: posValidator,
  initiative: v.number(),
  paCost: v.number(),
  pmCost: v.number(),
  manaCost: v.number(),
  damage: v.number(),
  range: v.number(),
  name: v.string(),
})

const combatEventValidator = v.union(
  v.object({
    type: v.literal('log'),
    text: v.string(),
  }),
  v.object({
    type: v.literal('move'),
    entity: v.union(v.literal('player1'), v.literal('player2')),
    pos: posValidator,
  }),
  v.object({
    type: v.literal('attack'),
    entity: v.union(v.literal('player1'), v.literal('player2')),
    target: posValidator,
    hit: v.boolean(),
    damage: v.number(),
  }),
  v.object({
    type: v.literal('stats'),
    entity: v.union(v.literal('player1'), v.literal('player2')),
    hp: v.number(),
    pa: v.number(),
    pm: v.number(),
    mana: v.number(),
  }),
)

export default defineSchema({
  matchmakingQueue: defineTable({
    clientId: v.string(),
    displayName: v.string(),
    createdAt: v.number(),
  }).index('by_clientId', ['clientId']),

  matches: defineTable({
    status: v.union(v.literal('active'), v.literal('completed')),
    phase: v.union(v.literal('planning'), v.literal('waiting_for_submissions')),
    turnNumber: v.number(),
    player1Id: v.string(),
    player2Id: v.string(),
    player1Name: v.string(),
    player2Name: v.string(),
    player1State: entityStateValidator,
    player2State: entityStateValidator,
    winner: v.union(v.literal('player1'), v.literal('player2'), v.literal('draw'), v.null()),
    lastResolvedTurn: v.number(),
  })
    .index('by_player1Id_and_status', ['player1Id', 'status'])
    .index('by_player2Id_and_status', ['player2Id', 'status']),

  turnSubmissions: defineTable({
    matchId: v.id('matches'),
    turnNumber: v.number(),
    playerSlot: v.union(v.literal('player1'), v.literal('player2')),
    queue: v.array(validatedActionValidator),
    submittedAt: v.number(),
  })
    .index('by_matchId_and_turnNumber', ['matchId', 'turnNumber'])
    .index('by_matchId_and_turnNumber_and_playerSlot', ['matchId', 'turnNumber', 'playerSlot']),

  matchEvents: defineTable({
    matchId: v.id('matches'),
    turnNumber: v.number(),
    events: v.array(combatEventValidator),
    createdAt: v.number(),
  }).index('by_matchId_and_turnNumber', ['matchId', 'turnNumber']),
})
