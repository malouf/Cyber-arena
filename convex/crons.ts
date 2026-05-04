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
  handler: async (ctx) => {
    return await ctx.db
      .query("matches")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

export const handleTimeout = internalMutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const match = await ctx.db.get("matches", args.matchId);
    if (!match || match.status !== "active") return;

    await ctx.db.patch("matches", args.matchId, {
      status: "completed",
      winner: "timeout",
    });
  },
});

export const checkTimeouts = internalAction({
  args: {},
  handler: async (ctx, args) => {
    const activeMatches = await ctx.runQuery(internal.crons.getActiveMatches);
    const now = Date.now();

    for (const match of activeMatches) {
      if (now > match.lastActivityAt + match.timeoutMs) {
        await ctx.runMutation(internal.crons.handleTimeout, {
          matchId: match._id,
        });
      }
    }
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
