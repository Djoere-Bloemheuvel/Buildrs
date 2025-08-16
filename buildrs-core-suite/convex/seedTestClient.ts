import { mutation } from "./_generated/server";

export const createTestClient = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if test client already exists
    const existing = await ctx.db
      .query("clients")
      .filter((q) => q.eq(q.field("domain"), "client-1"))
      .first();

    if (existing) {
      return { message: "Test client already exists", clientId: existing._id };
    }

    // Create test client
    const clientId = await ctx.db.insert("clients", {
      domain: "client-1",
      email: "test@buildrs.dev",
      name: "Test Client",
      company: "Test Company",
      contact: "Test Contact",
      phone: "+31 6 12345678",
      clientSummary: "Test client for development",
      currentLeadCredits: 1000,
      currentAbmCredits: 100,
      currentEmailCredits: 2000,
      currentLinkedinCredits: 500,
    });

    return { message: "Test client created", clientId };
  },
});