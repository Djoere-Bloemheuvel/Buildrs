import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * AUTOMATIC CLIENT MANAGEMENT SYSTEM
 * 
 * Handles automatic client creation/linking when users sign up via Clerk
 * Features:
 * - Domain-based client matching
 * - Automatic admin role assignment for first domain user
 * - Duplicate prevention
 * - Enterprise client management
 */

export const findOrCreateClientForUser = mutation({
  args: {
    userEmail: v.string(),
    userName: v.optional(v.string()),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`🔍 Finding or creating client for user: ${args.userEmail}`);
    
    // Extract domain from email
    const emailDomain = args.userEmail.split('@')[1];
    if (!emailDomain) {
      throw new Error('Invalid email format');
    }
    
    console.log(`📧 Email domain: ${emailDomain}`);
    
    // STEP 1: Check if client already exists for this domain
    let existingClient = await ctx.db
      .query("clients")
      .filter((q) => q.eq(q.field("domain"), emailDomain))
      .first();
    
    if (existingClient) {
      console.log(`✅ Found existing client: ${existingClient.name || existingClient.company} (${existingClient._id})`);
      
      // Check if this user is already linked to this client
      const existingProfile = await ctx.db
        .query("profiles") 
        .filter((q) => q.and(
          q.eq(q.field("clerkUserId"), args.clerkUserId),
          q.eq(q.field("clientId"), existingClient._id)
        ))
        .first();
      
      if (existingProfile) {
        console.log(`👤 User already has profile for this client`);
        return {
          client: existingClient,
          userProfile: existingProfile,
          action: "existing_link",
          isNewClient: false,
          isAdmin: existingProfile.role === "admin",
        };
      }
      
      // Link user to existing client
      console.log(`🔗 Linking user to existing client`);
      const userProfile = await ctx.db.insert("profiles", {
        clerkUserId: args.clerkUserId,
        clientId: existingClient._id,
        email: args.userEmail,
        name: args.userName || args.userEmail.split('@')[0],
        fullName: args.userName,
        role: "member", // Default role for additional users
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      return {
        client: existingClient,
        userProfile: await ctx.db.get(userProfile),
        action: "linked_to_existing",
        isNewClient: false,
        isAdmin: false,
      };
    }
    
    // STEP 2: Create new client for this domain
    console.log(`🏢 Creating new client for domain: ${emailDomain}`);
    
    // Generate company name from domain
    const companyName = generateCompanyNameFromDomain(emailDomain);
    
    const newClientId = await ctx.db.insert("clients", {
      // Required fields
      domain: emailDomain,
      email: args.userEmail,
      name: companyName,
      
      // Legacy compatibility
      company: companyName,
      contact: args.userName || args.userEmail.split('@')[0],
      
      // Credit system - start with trial credits
      currentLeadCredits: 50,       // 50 free lead credits
      currentEmailCredits: 100,     // 100 free email credits  
      currentLinkedinCredits: 25,   // 25 free LinkedIn credits
      currentAbmCredits: 10,        // 10 free ABM credits
      
      // Credit limits
      creditLimits: {
        maxLeadCredits: 1000,
        maxEmailCredits: 5000,
        maxLinkedinCredits: 500,
        maxAbmCredits: 100,
        allowOverdraft: false,
        overdraftLimit: 0,
      },
      
      // Business rules
      hasUsedStartPackage: false,
      hasReceivedFirstMonthBonus: false,
      subscriptionStatus: "trial",
      
      // Auto-topup disabled by default
      autoTopup: {
        enabled: false,
        triggerThreshold: 10,
        packageId: undefined,
      },
      
      // Timestamps
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    const newClient = await ctx.db.get(newClientId);
    console.log(`✅ Created new client: ${newClient!.name} (${newClientId})`);
    
    // STEP 3: Create user profile with admin role (first user is always admin)
    console.log(`👤 Creating admin user profile for first user`);
    const userProfileId = await ctx.db.insert("profiles", {
      clerkUserId: args.clerkUserId,
      clientId: newClientId,
      email: args.userEmail,
      name: args.userName || args.userEmail.split('@')[0],
      fullName: args.userName,
      role: "admin", // First user for domain gets admin role
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    const userProfile = await ctx.db.get(userProfileId);
    
    console.log(`🎉 Successfully created client and admin user for domain: ${emailDomain}`);
    
    // STEP 4: Setup default automations for new client
    try {
      console.log(`🔧 Setting up default automations for new client...`);
      const automationSetup = await ctx.runMutation("setupClientAutomations:setupAllDefaultAutomations", {
        clientId: newClientId,
      });
      console.log(`✅ Automations setup complete:`, automationSetup);
    } catch (error) {
      console.error(`⚠️ Failed to setup automations for client ${newClientId}:`, error);
      // Don't fail the entire client creation if automation setup fails
    }
    
    return {
      client: newClient,
      userProfile,
      action: "created_new_client",
      isNewClient: true,
      isAdmin: true,
    };
  },
});

// Helper function to generate company name from domain
function generateCompanyNameFromDomain(domain: string): string {
  // Remove common TLDs and subdomains
  let cleanDomain = domain
    .replace(/\.(com|nl|be|org|net|io|ai|dev)$/, '')
    .replace(/^www\./, '');
  
  // Split by dots and take the main part
  const parts = cleanDomain.split('.');
  const mainPart = parts[0];
  
  // Capitalize first letter
  return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
}

// Get user's client information
export const getUserClientInfo = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user profile
    const userProfile = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("clerkUserId"), args.clerkUserId))
      .first();
    
    if (!userProfile) {
      return null;
    }
    
    // Get client
    const client = await ctx.db.get(userProfile.clientId);
    
    return {
      userProfile,
      client,
      isAdmin: userProfile.role === "admin",
    };
  },
});

// Get all users for a client (admin only)
export const getClientUsers = query({
  args: {
    clientId: v.id("clients"),
    requestingUserId: v.string(), // Clerk user ID making the request
  },
  handler: async (ctx, args) => {
    // Verify requesting user is admin
    const requestingProfile = await ctx.db
      .query("profiles")
      .filter((q) => q.and(
        q.eq(q.field("clerkUserId"), args.requestingUserId),
        q.eq(q.field("clientId"), args.clientId)
      ))
      .first();
    
    if (!requestingProfile || requestingProfile.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    
    // Get all users for this client
    const clientUsers = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("clientId"), args.clientId))
      .collect();
    
    return clientUsers.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));
  },
});

// Update user role (admin only)
export const updateUserRole = mutation({
  args: {
    targetUserId: v.id("profiles"),
    newRole: v.union(v.literal("admin"), v.literal("member")),
    requestingUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get target user
    const targetUser = await ctx.db.get(args.targetUserId);
    if (!targetUser) {
      throw new Error("User not found");
    }
    
    // Verify requesting user is admin of the same client
    const requestingProfile = await ctx.db
      .query("profiles")
      .filter((q) => q.and(
        q.eq(q.field("clerkUserId"), args.requestingUserId),
        q.eq(q.field("clientId"), targetUser.clientId)
      ))
      .first();
    
    if (!requestingProfile || requestingProfile.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    
    // Don't allow changing your own role
    if (requestingProfile._id === args.targetUserId) {
      throw new Error("Cannot change your own role");
    }
    
    // Update role
    await ctx.db.patch(args.targetUserId, {
      role: args.newRole,
      updatedAt: Date.now(),
    });
    
    return { success: true, message: `Role updated to ${args.newRole}` };
  },
});