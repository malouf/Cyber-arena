import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'

type PlayerSlot = 'player1' | 'player2'
type Pos = { x: number; y: number }
type EntityState = Doc<'matches'>['player1State']
type ValidatedAction = Doc<'turnSubmissions'>['queue'][number]
type CombatEvent = Doc<'matchEvents'>['events'][number]

type RawAction = {
  type: 'move' | 'basic_attack'
  target: Pos
}

const BOARD_MIN = 0
const BOARD_MAX = 9

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

const rawActionValidator = v.object({
  type: v.union(v.literal('move'), v.literal('basic_attack')),
  target: posValidator,
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

function distanceHex(a: Pos, b: Pos): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx + dy))
}

function inBounds(pos: Pos): boolean {
  return (
    pos.x >= BOARD_MIN &&
    pos.x <= BOARD_MAX &&
    pos.y >= BOARD_MIN &&
    pos.y <= BOARD_MAX
  )
}

function cloneEntity(entity: EntityState): EntityState {
  return {
    ...entity,
    pos: { ...entity.pos },
    passives: [...entity.passives],
  }
}

function makeInitialState(startPos: Pos): EntityState {
  return {
    hp: 110,
    maxHp: 110,
    pa: 4,
    maxPa: 4,
    pm: 3,
    maxPm: 3,
    mana: 2,
    maxMana: 5,
    pos: startPos,
    passives: [],
  }
}

function determineSlot(match: Doc<'matches'>, clientId: string): PlayerSlot | null {
  if (match.player1Id === clientId) return 'player1'
  if (match.player2Id === clientId) return 'player2'
  return null
}

function validateAndNormalizeQueue(args: {
  actorStart: EntityState
  enemyStart: EntityState
  rawQueue: RawAction[]
}): { normalizedQueue: ValidatedAction[]; errors: string[] } {
  const errors: string[] = []
  const normalizedQueue: ValidatedAction[] = []

  if (args.rawQueue.length === 0) {
    errors.push('Queue cannot be empty.')
    return { normalizedQueue, errors }
  }

  if (args.rawQueue.length > 6) {
    errors.push('Queue exceeds max length of 6 actions.')
    return { normalizedQueue, errors }
  }

  const sim = cloneEntity(args.actorStart)

  for (let i = 0; i < args.rawQueue.length; i += 1) {
    const action = args.rawQueue[i]

    if (!inBounds(action.target)) {
      errors.push(`Action #${i + 1}: Target out of board bounds.`)
      continue
    }

    if (action.type === 'move') {
      const dist = distanceHex(sim.pos, action.target)
      if (dist <= 0) {
        errors.push(`Action #${i + 1}: Move must change position.`)
        continue
      }
      if (dist > sim.pm) {
        errors.push(`Action #${i + 1}: Not enough PM for move distance ${dist}.`)
        continue
      }
      if (
        action.target.x === args.enemyStart.pos.x &&
        action.target.y === args.enemyStart.pos.y
      ) {
        errors.push(`Action #${i + 1}: Move target occupied by opponent.`)
        continue
      }

      sim.pm -= dist
      sim.pos = action.target
      normalizedQueue.push({
        type: 'move',
        target: action.target,
        initiative: 100,
        paCost: 0,
        pmCost: dist,
        manaCost: 0,
        damage: 0,
        range: 0,
        name: 'Move',
      })
      continue
    }

    const attackCost = 2
    const attackRange = 1
    const attackDamage = 15
    if (sim.pa < attackCost) {
      errors.push(`Action #${i + 1}: Not enough PA for Basic Attack.`)
      continue
    }

    const dist = distanceHex(sim.pos, action.target)
    if (dist > attackRange) {
      errors.push(`Action #${i + 1}: Basic Attack out of range.`)
      continue
    }

    sim.pa -= attackCost
    normalizedQueue.push({
      type: 'basic_attack',
      target: action.target,
      initiative: 50,
      paCost: attackCost,
      pmCost: 0,
      manaCost: 0,
      damage: attackDamage,
      range: attackRange,
      name: 'Basic Attack',
    })
  }

  return { normalizedQueue, errors }
}

function resolvePvPTurn(args: {
  player1Start: EntityState
  player2Start: EntityState
  player1Queue: ValidatedAction[]
  player2Queue: ValidatedAction[]
}): {
  events: CombatEvent[]
  player1Next: EntityState
  player2Next: EntityState
} {
  const events: CombatEvent[] = []

  const p1 = cloneEntity(args.player1Start)
  const p2 = cloneEntity(args.player2Start)

  const maxSteps = Math.max(args.player1Queue.length, args.player2Queue.length)

  for (let i = 0; i < maxSteps; i += 1) {
    const stepActions: Array<{ slot: PlayerSlot; action: ValidatedAction }> = []
    const a1 = args.player1Queue[i]
    const a2 = args.player2Queue[i]
    if (a1) stepActions.push({ slot: 'player1', action: a1 })
    if (a2) stepActions.push({ slot: 'player2', action: a2 })

    stepActions.sort((left, right) => {
      if (right.action.initiative !== left.action.initiative) {
        return right.action.initiative - left.action.initiative
      }
      return left.slot === 'player1' ? -1 : 1
    })

    for (const current of stepActions) {
      const actor = current.slot === 'player1' ? p1 : p2
      const defender = current.slot === 'player1' ? p2 : p1

      if (actor.hp <= 0) {
        continue
      }

      if (current.action.type === 'move') {
        actor.pm = Math.max(0, actor.pm - current.action.pmCost)
        actor.pa = Math.max(0, actor.pa - current.action.paCost)
        actor.mana = Math.max(0, actor.mana - current.action.manaCost)
        actor.pos = { ...current.action.target }

        events.push({
          type: 'move',
          entity: current.slot,
          pos: { ...actor.pos },
        })
        events.push({
          type: 'stats',
          entity: current.slot,
          hp: actor.hp,
          pa: actor.pa,
          pm: actor.pm,
          mana: actor.mana,
        })
        continue
      }

      actor.pa = Math.max(0, actor.pa - current.action.paCost)
      const currentDist = distanceHex(actor.pos, current.action.target)
      const hit =
        currentDist <= current.action.range &&
        current.action.target.x === defender.pos.x &&
        current.action.target.y === defender.pos.y

      if (hit) {
        defender.hp = Math.max(0, defender.hp - current.action.damage)
      }

      events.push({
        type: 'attack',
        entity: current.slot,
        target: current.action.target,
        hit,
        damage: hit ? current.action.damage : 0,
      })
      events.push({
        type: 'stats',
        entity: current.slot,
        hp: actor.hp,
        pa: actor.pa,
        pm: actor.pm,
        mana: actor.mana,
      })
      events.push({
        type: 'stats',
        entity: current.slot === 'player1' ? 'player2' : 'player1',
        hp: defender.hp,
        pa: defender.pa,
        pm: defender.pm,
        mana: defender.mana,
      })
    }
  }

  p1.pa = p1.maxPa
  p1.pm = p1.maxPm
  p1.mana = Math.min(p1.maxMana, p1.mana + 1)

  p2.pa = p2.maxPa
  p2.pm = p2.maxPm
  p2.mana = Math.min(p2.maxMana, p2.mana + 1)

  events.push({
    type: 'log',
    text: 'Turn resolved on server.',
  })
  events.push({
    type: 'stats',
    entity: 'player1',
    hp: p1.hp,
    pa: p1.pa,
    pm: p1.pm,
    mana: p1.mana,
  })
  events.push({
    type: 'stats',
    entity: 'player2',
    hp: p2.hp,
    pa: p2.pa,
    pm: p2.pm,
    mana: p2.mana,
  })

  return {
    events,
    player1Next: p1,
    player2Next: p2,
  }
}

export const queueForMatch = mutation({
  args: {
    clientId: v.string(),
    displayName: v.string(),
  },
  returns: v.object({
    status: v.union(v.literal('waiting'), v.literal('matched')),
    matchId: v.union(v.id('matches'), v.null()),
  }),
  handler: async (ctx, args) => {
    const activeAsP1 = await ctx.db
      .query('matches')
      .withIndex('by_player1Id_and_status', (q) =>
        q.eq('player1Id', args.clientId).eq('status', 'active'),
      )
      .take(1)

    if (activeAsP1[0]) {
      return { status: 'matched' as const, matchId: activeAsP1[0]._id }
    }

    const activeAsP2 = await ctx.db
      .query('matches')
      .withIndex('by_player2Id_and_status', (q) =>
        q.eq('player2Id', args.clientId).eq('status', 'active'),
      )
      .take(1)

    if (activeAsP2[0]) {
      return { status: 'matched' as const, matchId: activeAsP2[0]._id }
    }

    const existingQueue = await ctx.db
      .query('matchmakingQueue')
      .withIndex('by_clientId', (q) => q.eq('clientId', args.clientId))
      .unique()

    const waitingQueue = await ctx.db.query('matchmakingQueue').order('asc').collect()
    const opponent = waitingQueue.find((entry) => entry.clientId !== args.clientId) ?? null

    if (!opponent) {
      if (!existingQueue) {
        await ctx.db.insert('matchmakingQueue', {
          clientId: args.clientId,
          displayName: args.displayName,
          createdAt: Date.now(),
        })
      }

      return { status: 'waiting' as const, matchId: null }
    }

    await ctx.db.delete(opponent._id)
    if (existingQueue) {
      await ctx.db.delete(existingQueue._id)
    }

    const player1Id = opponent.clientId
    const player2Id = args.clientId

    const matchId = await ctx.db.insert('matches', {
      status: 'active',
      phase: 'planning',
      turnNumber: 1,
      player1Id,
      player2Id,
      player1Name: opponent.displayName,
      player2Name: args.displayName,
      player1State: makeInitialState({ x: 1, y: 5 }),
      player2State: makeInitialState({ x: 8, y: 5 }),
      winner: null,
      lastResolvedTurn: 0,
    })

    return { status: 'matched' as const, matchId }
  },
})

export const leaveQueue = mutation({
  args: {
    clientId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const waitingEntry = await ctx.db
      .query('matchmakingQueue')
      .withIndex('by_clientId', (q) => q.eq('clientId', args.clientId))
      .unique()

    if (waitingEntry) {
      await ctx.db.delete(waitingEntry._id)
    }

    return null
  },
})

export const getLobbyState = query({
  args: {
    clientId: v.string(),
  },
  returns: v.object({
    waiting: v.boolean(),
    waitingSince: v.union(v.number(), v.null()),
    matchId: v.union(v.id('matches'), v.null()),
    slot: v.union(v.literal('player1'), v.literal('player2'), v.null()),
  }),
  handler: async (ctx, args) => {
    const activeAsP1 = await ctx.db
      .query('matches')
      .withIndex('by_player1Id_and_status', (q) =>
        q.eq('player1Id', args.clientId).eq('status', 'active'),
      )
      .take(1)

    if (activeAsP1[0]) {
      return {
        waiting: false,
        waitingSince: null,
        matchId: activeAsP1[0]._id,
        slot: 'player1' as const,
      }
    }

    const activeAsP2 = await ctx.db
      .query('matches')
      .withIndex('by_player2Id_and_status', (q) =>
        q.eq('player2Id', args.clientId).eq('status', 'active'),
      )
      .take(1)

    if (activeAsP2[0]) {
      return {
        waiting: false,
        waitingSince: null,
        matchId: activeAsP2[0]._id,
        slot: 'player2' as const,
      }
    }

    const queueEntry = await ctx.db
      .query('matchmakingQueue')
      .withIndex('by_clientId', (q) => q.eq('clientId', args.clientId))
      .unique()

    return {
      waiting: queueEntry !== null,
      waitingSince: queueEntry ? queueEntry.createdAt : null,
      matchId: null,
      slot: null,
    }
  },
})

export const getMatchState = query({
  args: {
    matchId: v.id('matches'),
    clientId: v.string(),
  },
  returns: v.object({
    matchId: v.id('matches'),
    status: v.union(v.literal('active'), v.literal('completed')),
    phase: v.union(v.literal('planning'), v.literal('waiting_for_submissions')),
    turnNumber: v.number(),
    yourSlot: v.union(v.literal('player1'), v.literal('player2')),
    playerState: entityStateValidator,
    enemyState: entityStateValidator,
    player1Submitted: v.boolean(),
    player2Submitted: v.boolean(),
    canSubmit: v.boolean(),
    latestEvents: v.array(combatEventValidator),
    winner: v.union(v.literal('player1'), v.literal('player2'), v.literal('draw'), v.null()),
  }),
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId)
    if (!match) {
      throw new Error('Match not found.')
    }

    const slot = determineSlot(match, args.clientId)
    if (!slot) {
      throw new Error('You are not a participant in this match.')
    }

    const submissions = await ctx.db
      .query('turnSubmissions')
      .withIndex('by_matchId_and_turnNumber', (q) =>
        q.eq('matchId', args.matchId).eq('turnNumber', match.turnNumber),
      )
      .collect()

    const player1Submitted = submissions.some((submission) => submission.playerSlot === 'player1')
    const player2Submitted = submissions.some((submission) => submission.playerSlot === 'player2')

    const latestTurn = match.turnNumber - 1
    const latestEventsRecord =
      latestTurn > 0
        ? await ctx.db
            .query('matchEvents')
            .withIndex('by_matchId_and_turnNumber', (q) =>
              q.eq('matchId', args.matchId).eq('turnNumber', latestTurn),
            )
            .take(1)
        : []

    return {
      matchId: match._id,
      status: match.status,
      phase: match.phase,
      turnNumber: match.turnNumber,
      yourSlot: slot,
      playerState: slot === 'player1' ? match.player1State : match.player2State,
      enemyState: slot === 'player1' ? match.player2State : match.player1State,
      player1Submitted,
      player2Submitted,
      canSubmit:
        match.status === 'active' &&
        (slot === 'player1' ? !player1Submitted : !player2Submitted),
      latestEvents: latestEventsRecord[0]?.events ?? [],
      winner: match.winner,
    }
  },
})

export const submitTurn = mutation({
  args: {
    matchId: v.id('matches'),
    clientId: v.string(),
    turnNumber: v.number(),
    queue: v.array(rawActionValidator),
  },
  returns: v.object({
    resolved: v.boolean(),
    waitingForOpponent: v.boolean(),
    nextTurnNumber: v.number(),
  }),
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId)
    if (!match) {
      throw new Error('Match not found.')
    }

    const slot = determineSlot(match, args.clientId)
    if (!slot) {
      throw new Error('Not allowed to submit for this match.')
    }

    if (match.status !== 'active') {
      throw new Error('Match is already completed.')
    }

    if (args.turnNumber < match.turnNumber) {
      return {
        resolved: true,
        waitingForOpponent: false,
        nextTurnNumber: match.turnNumber,
      }
    }

    if (args.turnNumber > match.turnNumber) {
      throw new Error(`Turn mismatch. Server is on turn ${match.turnNumber}.`)
    }

    const existingSubmission = await ctx.db
      .query('turnSubmissions')
      .withIndex('by_matchId_and_turnNumber_and_playerSlot', (q) =>
        q
          .eq('matchId', args.matchId)
          .eq('turnNumber', args.turnNumber)
          .eq('playerSlot', slot),
      )
      .unique()

    const actorStart = slot === 'player1' ? match.player1State : match.player2State
    const enemyStart = slot === 'player1' ? match.player2State : match.player1State

    const validation = validateAndNormalizeQueue({
      actorStart,
      enemyStart,
      rawQueue: args.queue,
    })

    if (validation.errors.length > 0) {
      throw new Error(`Invalid queue: ${validation.errors.join(' ')}`)
    }

    if (existingSubmission) {
      const sameQueue =
        JSON.stringify(existingSubmission.queue) === JSON.stringify(validation.normalizedQueue)
      if (!sameQueue) {
        throw new Error('Already submitted this turn with a different queue.')
      }
    } else {
      await ctx.db.insert('turnSubmissions', {
        matchId: args.matchId,
        turnNumber: args.turnNumber,
        playerSlot: slot,
        queue: validation.normalizedQueue,
        submittedAt: Date.now(),
      })
    }

    const submissions = await ctx.db
      .query('turnSubmissions')
      .withIndex('by_matchId_and_turnNumber', (q) =>
        q.eq('matchId', args.matchId).eq('turnNumber', args.turnNumber),
      )
      .collect()

    const p1Submission = submissions.find((submission) => submission.playerSlot === 'player1')
    const p2Submission = submissions.find((submission) => submission.playerSlot === 'player2')

    if (!p1Submission || !p2Submission) {
      await ctx.db.patch(args.matchId, {
        phase: 'waiting_for_submissions',
      })
      return {
        resolved: false,
        waitingForOpponent: true,
        nextTurnNumber: args.turnNumber,
      }
    }

    const result = resolvePvPTurn({
      player1Start: match.player1State,
      player2Start: match.player2State,
      player1Queue: p1Submission.queue,
      player2Queue: p2Submission.queue,
    })

    const player1Dead = result.player1Next.hp <= 0
    const player2Dead = result.player2Next.hp <= 0

    let winner: 'player1' | 'player2' | 'draw' | null = null
    if (player1Dead && player2Dead) winner = 'draw'
    else if (player1Dead) winner = 'player2'
    else if (player2Dead) winner = 'player1'

    const nextTurnNumber = winner ? args.turnNumber : args.turnNumber + 1

    await ctx.db.insert('matchEvents', {
      matchId: args.matchId,
      turnNumber: args.turnNumber,
      events: result.events,
      createdAt: Date.now(),
    })

    await ctx.db.patch(args.matchId, {
      status: winner ? 'completed' : 'active',
      phase: 'planning',
      player1State: result.player1Next,
      player2State: result.player2Next,
      winner,
      lastResolvedTurn: args.turnNumber,
      turnNumber: nextTurnNumber,
    })

    return {
      resolved: true,
      waitingForOpponent: false,
      nextTurnNumber,
    }
  },
})
