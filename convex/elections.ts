import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const elections = await ctx.db.query("election").collect();
    return elections;
  },
});

export const getElectionDetails = query({
  args: { electionId: v.id("election") },
  handler: async (ctx, { electionId }) => {
    const election = await ctx.db.get(electionId);
    if (!election) return null;

    const candidates = await ctx.db
      .query("candidate")
      .withIndex("by_election", (q) => q.eq("electionId", electionId))
      .collect();

    const voters = await ctx.db
      .query("voter")
      .withIndex("by_election", (q) => q.eq("electionId", electionId))
      .collect();

    return {
      election,
      candidates,
      voters,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    hasBlankVote: v.boolean(),
  },
  returns: v.id("election"),

  handler: async (ctx, { name, startDate, endDate, hasBlankVote }) => {
    const electionId = await ctx.db.insert("election", {
      name,
      startDate,
      endDate,
      isActive: false,
      hasBlankVote: hasBlankVote || false,
    });

    return electionId;
  },
});

export const update = mutation({
  args: {
    id: v.id("election"),
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    hasBlankVote: v.boolean(),
  },
  handler: async (ctx, args) => {
    const election = await ctx.db.get(args.id);

    if (!election) {
      throw new Error("Elección no encontrada");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      startDate: args.startDate,
      endDate: args.endDate,
      hasBlankVote: args.hasBlankVote,
    });

    return await ctx.db.get(args.id);
  },
});

export const deleteElection = mutation({
  args: { electionId: v.id("election") },
  handler: async (ctx, { electionId }) => {
    await ctx.db.delete(electionId);
  },
});

export const activateElection = mutation({
  args: { electionId: v.id("election") },
  handler: async (ctx, { electionId }) => {
    await ctx.db.patch(electionId, { isActive: true });
  },
});
