import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user profile by email
export const getProfileByEmail = query({
  args: { email: v.string() },
  returns: v.union(v.object({
    _id: v.id("profiles"),
    _creationTime: v.number(),
    fullName: v.optional(v.string()),
    email: v.string(),
    role: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// Get user profile by ID
export const getProfile = query({
  args: { id: v.id("profiles") },
  returns: v.union(v.object({
    _id: v.id("profiles"),
    _creationTime: v.number(),
    fullName: v.optional(v.string()),
    email: v.string(),
    role: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create or update user profile
export const upsertProfile = mutation({
  args: {
    email: v.string(),
    fullName: v.optional(v.string()),
    role: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, {
        fullName: args.fullName,
        role: args.role,
        clientId: args.clientId,
      });
      return existingProfile._id;
    } else {
      // Create new profile
      return await ctx.db.insert("profiles", {
        email: args.email,
        fullName: args.fullName,
        role: args.role || "user",
        clientId: args.clientId,
      });
    }
  },
});

// Get client information
export const getClient = query({
  args: { id: v.id("clients") },
  returns: v.union(v.object({
    _id: v.id("clients"),
    _creationTime: v.number(),
    company: v.string(),
    contact: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    domain: v.optional(v.string()),
    clientSummary: v.optional(v.string()),
    instantlyEmailListId: v.optional(v.string()),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new client
export const createClient = mutation({
  args: {
    company: v.string(),
    contact: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    domain: v.optional(v.string()),
    clientSummary: v.optional(v.string()),
  },
  returns: v.id("clients"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("clients", args);
  },
});