import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const setupUserClient = mutation({
  args: {
    email: v.string(),
    fullName: v.optional(v.string()),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`🔄 Setting up client for user: ${args.email}`);

    const emailDomain = args.email.split('@')[1];
    
    // Check if profile already exists
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    // If profile exists and already has a client, return existing
    if (profile?.clientId) {
      const existingClient = await ctx.db.get(profile.clientId);
      if (existingClient) {
        console.log(`✅ User ${args.email} already has client: ${existingClient.company}`);
        return {
          profileId: profile._id,
          clientId: profile.clientId,
          client: existingClient,
          isNew: false,
          sharedClient: false,
        };
      }
    }

    // SMART DOMAIN-BASED MATCHING
    // First check if a client already exists for this domain
    let existingClient = await ctx.db
      .query("clients")
      .filter((q) => q.eq(q.field("domain"), emailDomain))
      .first();

    let clientId;
    let isNewClient = false;
    let isSharedClient = false;

    if (existingClient) {
      // Use existing client for this domain
      clientId = existingClient._id;
      isSharedClient = true;
      console.log(`🔗 Linking ${args.email} to existing client for domain ${emailDomain}: ${existingClient.company}`);
    } else {
      // Create new client for this domain
      const companyName = emailDomain
        ? emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1)
        : args.fullName 
          ? `${args.fullName}'s Company`
          : 'My Company';

      clientId = await ctx.db.insert("clients", {
        company: companyName,
        contact: args.fullName || args.email.split('@')[0],
        email: args.email,
        domain: emailDomain,
        phone: undefined,
        clientSummary: `Client for ${emailDomain} domain`,
        instantlyEmailListId: undefined,
      });

      isNewClient = true;
      console.log(`✅ Created new client for domain ${emailDomain}: ${companyName} (${clientId})`);
    }

    // Determine user role
    let userRole = "admin"; // Default to admin

    if (isSharedClient) {
      // Check if there are already any admins for this client
      const existingAdmins = await ctx.db
        .query("profiles")
        .filter((q) => q.and(
          q.eq(q.field("clientId"), clientId),
          q.eq(q.field("role"), "admin")
        ))
        .collect();

      // If there are already admins, make this user a regular user
      // If no admins exist, make this user the admin (takeover scenario)
      userRole = existingAdmins.length > 0 ? "user" : "admin";
      
      if (userRole === "admin") {
        console.log(`👑 ${args.email} becomes admin of existing client (no previous admin found)`);
      }
    }

    // Create or update profile
    let profileId;
    if (profile) {
      // Update existing profile with client link
      await ctx.db.patch(profile._id, {
        clientId,
        fullName: args.fullName,
        role: userRole,
      });
      profileId = profile._id;
    } else {
      // Create new profile
      profileId = await ctx.db.insert("profiles", {
        email: args.email,
        fullName: args.fullName,
        role: userRole,
        clientId,
      });
    }

    const finalClient = await ctx.db.get(clientId);

    console.log(`✅ Setup complete for ${args.email}: Linked to client ${finalClient?.company} (${isSharedClient ? 'shared' : 'new'} client, role: ${userRole})`);

    return {
      profileId,
      clientId,
      client: finalClient,
      isNew: isNewClient,
      sharedClient: isSharedClient,
      userRole,
    };
  },
});

export const getUserClientInfo = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!profile) {
      return { hasProfile: false, hasClient: false };
    }

    if (!profile.clientId) {
      return { 
        hasProfile: true, 
        hasClient: false, 
        profile 
      };
    }

    const client = await ctx.db.get(profile.clientId);

    return {
      hasProfile: true,
      hasClient: !!client,
      profile,
      client,
    };
  },
});

export const ensureUserHasClient = mutation({
  args: {
    email: v.string(),
    fullName: v.optional(v.string()),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check current status
    const status = await ctx.runQuery("autoClientSetup:getUserClientInfo", {
      email: args.email,
    });

    // If user already has a client, return it
    if (status.hasClient && status.client) {
      return {
        profileId: status.profile!._id,
        clientId: status.client._id,
        client: status.client,
        isNew: false,
      };
    }

    // Otherwise, set up the client
    return await ctx.runMutation("autoClientSetup:setupUserClient", args);
  },
});