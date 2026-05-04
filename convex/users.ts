import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getOrCreateUser = mutation({
  args: {
    clientId: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .unique();

    if (existing) return existing;

    const userId = await ctx.db.insert("users", {
      clientId: args.clientId,
      displayName: args.displayName,
      skins: [],
      xp: 0,
      level: 1,
      battlePassPremium: false,
    });
    return await ctx.db.get("users", userId);
  },
});

export const updateEquippedSkin = mutation({
  args: {
    clientId: v.string(),
    skinId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .unique();
    if (!user) throw new Error("User not found");

    await ctx.db.patch("users", user._id, { equippedSkin: args.skinId });
  },
});

export const addXp = mutation({
  args: {
    clientId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .unique();
    if (!user) throw new Error("User not found");

    let newXp = user.xp + args.amount;
    let newLevel = user.level;
    while (newXp >= newLevel * 1000) {
      newXp -= newLevel * 1000;
      newLevel++;
    }

    await ctx.db.patch("users", user._id, { xp: newXp, level: newLevel });
  },
});
