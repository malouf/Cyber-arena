import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export const getOrCreateUser = mutation({
  args: {
    clientId: v.string(),
    displayName: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clientId: v.string(),
      displayName: v.string(),
      skins: v.array(v.string()),
      equippedSkin: v.optional(v.string()),
      xp: v.number(),
      level: v.number(),
      battlePassPremium: v.boolean(),
      pushToken: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx: any, args: any): Promise<Doc<"users"> | null> => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clientId", (q: any) => q.eq("clientId", args.clientId))
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
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clientId", (q: any) => q.eq("clientId", args.clientId))
      .unique();
    if (!user) throw new Error("User not found");

    await ctx.db.patch("users", user._id, { equippedSkin: args.skinId });
    return null;
  },
});

export const addXp = mutation({
  args: {
    clientId: v.string(),
    amount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clientId", (q: any) => q.eq("clientId", args.clientId))
      .unique();
    if (!user) throw new Error("User not found");

    let newXp = user.xp + args.amount;
    let newLevel = user.level;
    while (newXp >= newLevel * 1000) {
      newXp -= newLevel * 1000;
      newLevel++;
    }

    await ctx.db.patch("users", user._id, { xp: newXp, level: newLevel });
    return null;
  },
});
