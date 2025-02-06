import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,

  election: defineTable({
    name: v.string(),
    endDate: v.number(),
    isActive: v.boolean(),
    startDate: v.number(),
    hasBlankVote: v.boolean(),
  }),

  candidate: defineTable({
    name: v.string(),
    votes: v.number(),
    electionId: v.id("election"),
  }).index("by_election", ["electionId"]),

  voter: defineTable({
    name: v.string(),
    email: v.string(),
    electionId: v.id("election"),
    generatedLink: v.optional(v.string()),
    hasVoted: v.boolean(),
    votedFor: v.optional(v.id("candidate")),
    votedAt: v.optional(v.number()),
  }).index("by_election", ["electionId"]),
  // Your other tables...
});

export default schema;
