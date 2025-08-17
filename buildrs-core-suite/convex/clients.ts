import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get or create a client for a user
 * This ensures every authenticated user has a client context
 */
export const getOrCreateUserClient = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // First try to find existing client for this user
    const existingClient = await ctx.db
      .query("clients")
      .withIndex("by_owner", q => q.eq("ownerId", args.userId))
      .first();

    if (existingClient) {
      return existingClient;
    }

    // If no client exists, we need to create one
    // But queries can't create data, so we return null and let the frontend handle it
    return null;
  },
});

/**
 * Create a new client for a user
 */
export const createUserClient = mutation({
  args: {
    userId: v.string(),
    companyName: v.optional(v.string()),
    industry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if client already exists
    const existingClient = await ctx.db
      .query("clients")
      .withIndex("by_owner", q => q.eq("ownerId", args.userId))
      .first();

    if (existingClient) {
      return existingClient._id;
    }

    // Create new client
    const clientId = await ctx.db.insert("clients", {
      ownerId: args.userId,
      companyName: args.companyName || "My Company",
      industry: args.industry || "Technology",
      subscriptionTier: "free",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return clientId;
  },
});

/**
 * Get client by ID (with permission check)
 */
export const getClient = query({
  args: {
    clientId: v.id("clients"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    
    if (!client) {
      return null;
    }

    // Check if user has access to this client
    if (client.ownerId !== args.userId) {
      throw new Error("Access denied to this client");
    }

    return client;
  },
});

/**
 * Update client information
 */
export const updateClient = mutation({
  args: {
    clientId: v.id("clients"),
    userId: v.string(),
    companyName: v.optional(v.string()),
    industry: v.optional(v.string()),
    subscriptionTier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    
    if (!client) {
      throw new Error("Client not found");
    }

    // Check if user has access to this client
    if (client.ownerId !== args.userId) {
      throw new Error("Access denied to this client");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.companyName !== undefined) updates.companyName = args.companyName;
    if (args.industry !== undefined) updates.industry = args.industry;
    if (args.subscriptionTier !== undefined) updates.subscriptionTier = args.subscriptionTier;

    return await ctx.db.patch(args.clientId, updates);
  },
});

/**
 * Get all clients (admin function)
 */
export const getAllClients = query({
  args: {},
  handler: async (ctx) => {
    // In a real implementation, you'd check for admin permissions here
    return await ctx.db.query("clients").collect();
  },
});