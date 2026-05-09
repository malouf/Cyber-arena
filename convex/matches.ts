import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { soulData } from "./data";
import { getDistance, resolveMatchTurn } from "./gameEngine";
import {
  combatEventValidator,
  entityStateValidator,
  mapObjectValidator,
  playerStateInMatchValidator,
} from "./validators";
import type { Doc } from "./_generated/dataModel";

type Pos = { x: number; y: number };
type EntityState = Doc<"matches">["players"][number]["state"];
type ValidatedAction = Doc<"turnSubmissions">["queue"][number];

const obstacles: Array<Pos> = [];

function makeInitialState(
  startPos: Pos,
  primarySoul: string,
  secondarySoul: string,
  slots: Array<any>,
): EntityState {
  const soul = soulData[primarySoul as keyof typeof soulData];
  const selectedPassives = slots
    .filter((s) => s.kind === "passive")
    .map((s) => s.passiveId);

  return {
    hp: soul.baseStats.hp,
    maxHp: soul.baseStats.hp,
    pa: soul.baseStats.pa,
    maxPa: soul.baseStats.pa,
    pm: soul.baseStats.pm,
    maxPm: soul.baseStats.pm,
    mana: 1,
    maxMana: soul.baseStats.mana,
    pos: startPos,
    passives: selectedPassives,
    loadout: {
      primarySoul,
      secondarySoul,
      slots,
    },
    effects: [],
  };
}

export const queueForMatch = mutation({
  args: {
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
    type: v.union(v.literal("casual"), v.literal("strategic")),
  },
  returns: v.object({
    status: v.union(v.literal("waiting"), v.literal("matched")),
    matchId: v.union(v.id("matches"), v.null()),
  }),
  handler: async (ctx: any, args: any) => {
    // Join queue
    await ctx.db.insert("matchmakingQueue", {
      clientId: args.clientId,
      displayName: args.displayName,
      primarySoul: args.primarySoul,
      secondarySoul: args.secondarySoul,
      slots: args.slots,
      items: args.items,
      mode: args.mode,
      createdAt: Date.now(),
    });

    // Try to match
    const waiting = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_mode", (q: any) => q.eq("mode", args.mode))
      .order("asc")
      .collect();

    const needed = args.mode === "1v1" ? 2 : 6;
    if (waiting.length >= needed) {
      const matchedPlayers = waiting.slice(0, needed);

      // Remove from queue
      for (const p of matchedPlayers) {
        await ctx.db.delete("matchmakingQueue", p._id);
      }

      const players = matchedPlayers.map((p: any, i: number) => {
        const isTeam1 = i < needed / 2;
        const teamIdx = i % (needed / 2);
        const startPos = isTeam1
          ? { x: 1, y: 2 + teamIdx * 4 }
          : { x: args.mode === "1v1" ? 8 : 13, y: 2 + teamIdx * 4 };

        return {
          clientId: p.clientId,
          name: p.displayName,
          slot: isTeam1 ? `team1_${teamIdx}` : `team2_${teamIdx}`,
          state: makeInitialState(
            startPos,
            p.primarySoul,
            p.secondarySoul,
            p.slots,
          ),
        };
      });

      const matchId = await ctx.db.insert("matches", {
        status: "active",
        phase: "planning",
        mode: args.mode,
        turnNumber: 1,
        players,
        mapObjects: [
          { type: "hp", pos: { x: 5, y: 5 }, value: 20, collected: false },
          {
            type: "mana",
            pos: { x: 10, y: 10 },
            value: 2,
            collected: false,
          },
        ],
        winner: null,
        lastResolvedTurn: 0,
        lastActivityAt: Date.now(),
        timeoutMs: args.type === "strategic" ? 24 * 60 * 60 * 1000 : 60 * 1000,
        type: args.type,
      });

      return { status: "matched" as const, matchId };
    }

    return { status: "waiting" as const, matchId: null };
  },
});

export const leaveQueue = mutation({
  args: {
    clientId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const waitingEntry = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_clientId", (q: any) => q.eq("clientId", args.clientId))
      .unique();

    if (waitingEntry) {
      await ctx.db.delete("matchmakingQueue", waitingEntry._id);
    }

    return null;
  },
});

export const getLobbyState = query({
  args: {
    clientId: v.string(),
  },
  returns: v.object({
    waiting: v.boolean(),
    waitingSince: v.union(v.number(), v.null()),
    matchId: v.union(v.id("matches"), v.null()),
    slot: v.union(v.string(), v.null()),
  }),
  handler: async (ctx: any, args: any) => {
    const activeMatches = await ctx.db
      .query("matches")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .collect();

    const currentMatch = activeMatches.find((m: any) =>
      m.players.some((p: any) => p.clientId === args.clientId),
    );

    if (currentMatch) {
      const player = currentMatch.players.find(
        (p: any) => p.clientId === args.clientId,
      )!;
      return {
        waiting: false,
        waitingSince: null,
        matchId: currentMatch._id,
        slot: player.slot,
      };
    }

    const queueEntry = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_clientId", (q: any) => q.eq("clientId", args.clientId))
      .unique();

    return {
      waiting: queueEntry !== null,
      waitingSince: queueEntry ? queueEntry.createdAt : null,
      matchId: null,
      slot: null,
    };
  },
});

export const getMatchState = query({
  args: {
    matchId: v.id("matches"),
    clientId: v.string(),
  },
  returns: v.object({
    matchId: v.id("matches"),
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
    yourSlot: v.string(),
    playerState: entityStateValidator,
    enemyState: entityStateValidator,
    player1Submitted: v.boolean(),
    player2Submitted: v.boolean(),
    submittedSlots: v.array(v.string()),
    canSubmit: v.boolean(),
    latestEvents: v.array(combatEventValidator),
  }),
  handler: async (ctx: any, args: any) => {
    const match = await ctx.db.get("matches", args.matchId);
    if (!match) throw new Error("Match not found.");

    const player = match.players.find((p: any) => p.clientId === args.clientId);
    if (!player) throw new Error("Not a participant.");

    const enemy = match.players.find((p: any) => p.clientId !== args.clientId);

    const submissions = await ctx.db
      .query("turnSubmissions")
      .withIndex("by_matchId_and_turnNumber", (q: any) =>
        q.eq("matchId", args.matchId).eq("turnNumber", match.turnNumber),
      )
      .collect();

    const submittedSlots = submissions.map((s: any) => s.playerSlot);

    const latestTurn = match.turnNumber - 1;
    const latestEventsRecord =
      latestTurn > 0
        ? await ctx.db
            .query("matchEvents")
            .withIndex("by_matchId_and_turnNumber", (q: any) =>
              q.eq("matchId", args.matchId).eq("turnNumber", latestTurn),
            )
            .unique()
        : null;

    return {
      matchId: match._id,
      status: match.status,
      phase: match.phase,
      mode: match.mode,
      turnNumber: match.turnNumber,
      players: match.players,
      mapObjects: match.mapObjects,
      winner: match.winner,
      lastResolvedTurn: match.lastResolvedTurn,
      lastActivityAt: match.lastActivityAt,
      timeoutMs: match.timeoutMs,
      type: match.type,
      yourSlot: player.slot,
      playerState: player.state,
      enemyState: enemy?.state ?? player.state,
      player1Submitted: submittedSlots.includes("team1_0"),
      player2Submitted: submittedSlots.includes("team2_0"),
      submittedSlots,
      canSubmit:
        match.status === "active" && !submittedSlots.includes(player.slot),
      latestEvents: latestEventsRecord?.events ?? [],
    };
  },
});

export const submitTurn = mutation({
  args: {
    matchId: v.id("matches"),
    clientId: v.string(),
    turnNumber: v.number(),
    queue: v.array(
      v.object({
        type: v.union(v.literal("move"), v.literal("ability")),
        target: v.object({ x: v.number(), y: v.number() }),
        abilityId: v.optional(v.string()),
      }),
    ),
  },
  returns: v.object({
    resolved: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const match = await ctx.db.get("matches", args.matchId);
    if (!match || match.status !== "active") throw new Error("Invalid match.");

    const player = match.players.find((p: any) => p.clientId === args.clientId);
    if (!player) throw new Error("Not a participant.");

    if (args.turnNumber !== match.turnNumber) return { resolved: false };

    const existing = await ctx.db
      .query("turnSubmissions")
      .withIndex("by_matchId_and_turnNumber_and_playerSlot", (q: any) =>
        q
          .eq("matchId", args.matchId)
          .eq("turnNumber", args.turnNumber)
          .eq("playerSlot", player.slot),
      )
      .unique();

    if (existing) throw new Error("Already submitted.");

    // Basic validation and normalization
    const normalizedQueue: Array<ValidatedAction> = [];
    let simPa = player.state.pa;
    let simPm = player.state.pm;
    let simMana = player.state.mana;
    let simPos = { ...player.state.pos };

    for (const action of args.queue) {
      if (action.type === "move") {
        const dist = getDistance(simPos, action.target);
        if (dist > simPm) throw new Error("Not enough PM");
        simPm -= dist;
        simPos = action.target;
        normalizedQueue.push({
          type: "move",
          target: action.target,
          initiative: 100,
          paCost: 0,
          pmCost: dist,
          manaCost: 0,
          damage: 0,
          range: 0,
          name: "Move",
        });
      } else {
        // Find ability in soul data
        const primarySoul =
          soulData[player.state.loadout.primarySoul as keyof typeof soulData];
        const secondarySoul =
          soulData[player.state.loadout.secondarySoul as keyof typeof soulData];

        const allAvailableAbilities = [
          primarySoul.baseAttack,
          primarySoul.ultimate,
          ...primarySoul.actives,
          ...secondarySoul.actives,
        ];

        const ability = allAvailableAbilities.find(
          (a: any) => a.id === action.abilityId,
        );

        if (!ability) throw new Error("Ability not found: " + action.abilityId);

        if (
          simPa < ability.paCost ||
          simPm < ability.pmCost ||
          simMana < ability.manaCost
        ) {
          throw new Error("Not enough resources for " + ability.name);
        }

        simPa -= ability.paCost;
        simPm -= ability.pmCost;
        simMana -= ability.manaCost;

        normalizedQueue.push({
          type: "ability",
          target: action.target,
          initiative: ability.initiative,
          paCost: ability.paCost,
          pmCost: ability.pmCost,
          manaCost: ability.manaCost,
          damage: ability.damage,
          range: ability.range,
          name: ability.name,
          abilityId: ability.id,
          abilityType: ability.type,
        });
      }
    }

    await ctx.db.insert("turnSubmissions", {
      matchId: args.matchId,
      turnNumber: args.turnNumber,
      playerSlot: player.slot,
      queue: normalizedQueue,
      submittedAt: Date.now(),
    });

    const submissions = await ctx.db
      .query("turnSubmissions")
      .withIndex("by_matchId_and_turnNumber", (q: any) =>
        q.eq("matchId", args.matchId).eq("turnNumber", args.turnNumber),
      )
      .collect();

    if (submissions.length === match.players.length) {
      // Resolve turn
      const result = resolveMatchTurn(
        match.players,
        submissions,
        obstacles,
        match.mapObjects,
      );

      // Check win condition
      const team1Alive = result.nextPlayers.some(
        (p: any) => p.slot.startsWith("team1") && p.state.hp > 0,
      );
      const team2Alive = result.nextPlayers.some(
        (p: any) => p.slot.startsWith("team2") && p.state.hp > 0,
      );

      let winner: string | "draw" | null = null;
      if (!team1Alive && !team2Alive) winner = "draw";
      else if (!team1Alive) winner = "team2";
      else if (!team2Alive) winner = "team1";

      await ctx.db.insert("matchEvents", {
        matchId: args.matchId,
        turnNumber: args.turnNumber,
        events: result.events,
        createdAt: Date.now(),
      });

      // Record analytics
      for (const slot in result.analytics) {
        await ctx.db.insert("analytics", {
          matchId: args.matchId,
          playerSlot: slot,
          ...result.analytics[slot],
        });
      }

      await ctx.db.patch("matches", args.matchId, {
        players: result.nextPlayers,
        mapObjects: result.nextMapObjects,
        turnNumber: winner ? match.turnNumber : match.turnNumber + 1,
        status: winner ? "completed" : "active",
        phase: "planning",
        winner,
        lastResolvedTurn: args.turnNumber,
        lastActivityAt: Date.now(),
      });

      return { resolved: true };
    } else {
      await ctx.db.patch("matches", args.matchId, {
        phase: "waiting_for_submissions",
        lastActivityAt: Date.now(),
      });
      return { resolved: false };
    }
  },
});

export const getMatchAnalytics = query({
  args: {
    matchId: v.id("matches"),
  },
  returns: v.array(
    v.object({
      _id: v.id("analytics"),
      _creationTime: v.number(),
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
    }),
  ),
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("analytics")
      .withIndex("by_matchId", (q: any) => q.eq("matchId", args.matchId))
      .collect();
  },
});
