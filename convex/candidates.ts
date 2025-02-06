import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    electionId: v.id("election"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("candidate", { name: args.name, electionId: args.electionId, votes: 0 });
  },
});

export const update = mutation({
  args: {
    candidateId: v.id("candidate"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.candidateId, { name: args.name });
  },
});

export const deleteCandidate = mutation({
  args: {
    candidateId: v.id("candidate"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.candidateId);
  },
});

export const getCandidatesByElection = query({
  args: {
    electionId: v.id("election"),
  },
  handler: async (ctx, args) => {
    const election = await ctx.db.get(args.electionId);
    if (!election) {
      throw new Error("Elección no encontrada");
    }
    const candidates = await ctx.db
      .query("candidate")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .collect();

    return {
      candidates,
      election,
    };
  },
});
