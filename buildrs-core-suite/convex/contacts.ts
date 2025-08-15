import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get contacts with optional filters
export const list = query({
  args: { 
    companyId: v.optional(v.id("companies")),
    clientId: v.optional(v.id("clients")),
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("contacts"),
    _creationTime: v.number(),
    companyId: v.optional(v.id("companies")),
    clientId: v.optional(v.id("clients")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    status: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    mobilePhone: v.optional(v.string()),
    seniority: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    let contacts = ctx.db.query("contacts");
    
    if (args.companyId) {
      contacts = contacts.withIndex("by_company", (q) => q.eq("companyId", args.companyId));
    } else if (args.clientId) {
      contacts = contacts.withIndex("by_client", (q) => q.eq("clientId", args.clientId));
    } else if (args.status) {
      contacts = contacts.withIndex("by_status", (q) => q.eq("status", args.status));
    }
    
    contacts = contacts.order("desc");
    
    if (args.limit) {
      return await contacts.take(args.limit);
    }
    
    return await contacts.collect();
  },
});

// Get contact by ID
export const getById = query({
  args: { id: v.id("contacts") },
  returns: v.union(v.object({
    _id: v.id("contacts"),
    _creationTime: v.number(),
    companyId: v.optional(v.id("companies")),
    clientId: v.optional(v.id("clients")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    mobilePhone: v.optional(v.string()),
    companyPhone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    seniority: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    isLinkedinConnected: v.optional(v.boolean()),
    lastLinkedinConnectionCheck: v.optional(v.number()),
    optedIn: v.optional(v.boolean()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new contact
export const create = mutation({
  args: {
    companyId: v.optional(v.id("companies")),
    clientId: v.optional(v.id("clients")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    mobilePhone: v.optional(v.string()),
    companyPhone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    seniority: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    status: v.optional(v.string()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  returns: v.id("contacts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("contacts", {
      ...args,
      status: args.status || "cold",
      tags: [],
      optedIn: false,
    });
  },
});

// Update contact
export const update = mutation({
  args: {
    id: v.id("contacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    mobilePhone: v.optional(v.string()),
    companyPhone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    seniority: v.optional(v.string()),
    functionGroup: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isLinkedinConnected: v.optional(v.boolean()),
    optedIn: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    
    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(cleanData).length > 0) {
      await ctx.db.patch(id, cleanData);
    }
    
    return null;
  },
});

// Delete contact
export const remove = mutation({
  args: { id: v.id("contacts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// Get contacts by company
export const getByCompany = query({
  args: { companyId: v.id("companies") },
  returns: v.array(v.object({
    _id: v.id("contacts"),
    _creationTime: v.number(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    status: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();
  },
});