import { query } from "./_generated/server";

export const getFirstClient = query({
  args: {},
  returns: undefined,
  handler: async (ctx) => {
    const client = await ctx.db.query("clients").first();
    return client;
  },
});