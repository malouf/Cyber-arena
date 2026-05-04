import { cronJobs } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";

export const getActiveMatches = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("matches"),
      _creationTime: v.number(),
      status: v.union(v.literal("active"), v.literal("completed")),
      phase: v.union(
        v.literal("planning"),
        v.literal("waiting_for_submissions"),
      ),
      mode: v.union(v.literal("1v1"), v.literal("3v3")),
      turnNumber: v.number(),
      players: v.array(v.any()),
      mapObjects: v.array(v.any()),
      winner: v.union(v.string(), v.literal("draw"), v.null()),
      lastResolvedTurn: v.number(),
      lastActivityAt: v.number(),
      timeoutMs: v.number(),
      type: v.union(v.literal("casual"), v.literal("strategic")),
    }),
  ),
  handler: async (ctx: any) => {
    return await ctx.db
      .query("matches")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .collect();
  },
});

export const handleTimeout = internalMutation({
  args: { matchId: v.id("matches") },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const match = await ctx.db.get("matches", args.matchId);
    if (!match || match.status !== "active") return null;

    await ctx.db.patch("matches", args.matchId, {
      status: "completed",
      winner: "timeout",
    });
    return null;
  },
});

export const checkTimeouts = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx: any) => {
    const activeMatches = await ctx.runQuery(internal.crons.getActiveMatches);
    const now = Date.now();

    for (const match of activeMatches) {
      if (now > match.lastActivityAt + match.timeoutMs) {
        await ctx.runMutation(internal.crons.handleTimeout, {
          matchId: match._id,
        });
      }
    }
    return null;
  },
});

const crons = cronJobs();
crons.interval(
  "check-match-timeouts",
  { minutes: 5 },
  internal.crons.checkTimeouts,
  {},
);
export default crons;
