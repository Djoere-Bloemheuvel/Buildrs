import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const testClientLookup = mutation({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`Looking for client with ID: ${args.clientId}`);
    
    // Find client based on string identifier
    let client = await ctx.db
      .query("clients")
      .filter((q) => q.eq(q.field("domain"), args.clientId))
      .first();

    console.log(`Found client by domain: ${JSON.stringify(client)}`);

    if (!client) {
      // For backwards compatibility, try to find by any field that might match
      client = await ctx.db
        .query("clients") 
        .first(); // For now, just use the first client for testing
      
      console.log(`Fallback to first client: ${JSON.stringify(client)}`);
    }

    if (!client) {
      throw new Error(`Client not found for identifier: ${args.clientId}`);
    }

    console.log(`Final client ID: ${client._id}`);
    
    return {
      clientId: args.clientId,
      foundClient: client,
      convexClientId: client._id,
    };
  },
});

export const testAutomationCreate = mutation({
  args: {
    clientId: v.string(),
    templateId: v.id("automationTemplates"),
    dailyLimit: v.number(),
    executionTime: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Find client
    let client = await ctx.db
      .query("clients")
      .filter((q) => q.eq(q.field("domain"), args.clientId))
      .first();

    if (!client) {
      client = await ctx.db.query("clients").first();
    }

    if (!client) {
      throw new Error(`Client not found for identifier: ${args.clientId}`);
    }

    console.log(`Creating automation for client: ${client._id}`);
    
    // Try the insert
    return await ctx.db.insert("clientAutomations", {
      clientId: client._id,
      templateId: args.templateId,
      customName: "Test Automation",
      isActive: true,
      dailyLimit: args.dailyLimit,
      executionTime: args.executionTime,
      totalConverted: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});