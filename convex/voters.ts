import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const bulkCreate = mutation({
  args: {
    voters: v.array(
      v.object({
        name: v.string(),
        email: v.string(),
      }),
    ),
    electionId: v.id("election"),
  },
  handler: async (ctx, args) => {
    const { voters, electionId } = args;

    const dataToInsert = voters.map((voter) => ({
      name: voter.name,
      email: voter.email,
      electionId,
      hasVoted: false,
    }));

    for (const voter of dataToInsert) {
      await ctx.db.insert("voter", voter);
    }
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    electionId: v.id("election"),
  },
  handler: async (ctx, args) => {
    const { name, email, electionId } = args;
    await ctx.db.insert("voter", { name, email, electionId, hasVoted: false });
  },
});

export const generateVoterUrls = mutation({
  args: {
    electionId: v.id("election"),
  },
  handler: async (ctx, args) => {
    const voters = await ctx.db
      .query("voter")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .collect();

    for (const voter of voters) {
      await ctx.db.patch(voter._id, {
        generatedLink: `${process.env.SITE_URL}/voto/${args.electionId}&${voter._id}`,
      });
    }

    const newVoters = await ctx.db
      .query("voter")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .collect();

    return newVoters.map((voter) => ({ name: voter.name, email: voter.email, url: voter.generatedLink }));
  },
});

export const bulkDelete = mutation({
  args: {
    voterIds: v.array(v.id("voter")),
    electionId: v.id("election"),
  },
  handler: async (ctx, args) => {
    // Opcional: Verificar permisos aquí

    for (const voterId of args.voterIds) {
      await ctx.db.delete(voterId);
    }
  },
});

export const getVoterDetails = query({
  args: {
    electionId: v.id("election"),
    voterId: v.id("voter"),
  },
  handler: async (ctx, args) => {
    const voter = await ctx.db.get(args.voterId);
    const election = await ctx.db.get(args.electionId);

    if (!voter || !election) {
      return null;
    }

    return {
      voter,
      election,
    };
  },
});

export const registerVote = mutation({
  args: {
    voterId: v.id("voter"),
    candidateId: v.union(v.id("candidate"), v.literal("blank")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.voterId, {
      hasVoted: true,
      votedFor: args.candidateId === "blank" ? undefined : args.candidateId,
      votedAt: Date.now(),
    });
    if (args.candidateId !== "blank") {
      const candidate = await ctx.db.get(args.candidateId);
      if (!candidate) {
        throw new Error("Candidato no encontrado");
      }
      await ctx.db.patch(args.candidateId, {
        votes: candidate.votes + 1,
      });
    }
  },
});
