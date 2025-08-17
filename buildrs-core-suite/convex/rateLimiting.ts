import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Comprehensive rate limiting system for the communications platform
 * Protects against abuse and ensures fair usage across all endpoints
 */

// Rate limit configurations for different endpoint types
const RATE_LIMITS = {
  // OAuth endpoints (per IP per hour)
  oauth_token_exchange: { limit: 100, windowMs: 60 * 60 * 1000 },
  oauth_refresh: { limit: 50, windowMs: 60 * 60 * 1000 },
  oauth_callback: { limit: 20, windowMs: 60 * 60 * 1000 },
  
  // Communication endpoints (per client per minute)
  log_communication: { limit: 1000, windowMs: 60 * 1000 },
  update_communication: { limit: 500, windowMs: 60 * 1000 },
  get_timeline: { limit: 100, windowMs: 60 * 1000 },
  
  // Email sync endpoints (per account per hour)
  email_sync: { limit: 10, windowMs: 60 * 60 * 1000 },
  manual_sync: { limit: 5, windowMs: 60 * 60 * 1000 },
  
  // Client creation (per IP per day)
  create_client: { limit: 5, windowMs: 24 * 60 * 60 * 1000 },
  
  // General API (per client per minute)
  general_api: { limit: 1000, windowMs: 60 * 1000 },
} as const;

type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Check if a request is within rate limits
 */
export const checkRateLimit = action({
  args: {
    limitType: v.string(),
    identifier: v.string(), // Can be IP, clientId, email, etc.
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const limitType = args.limitType as RateLimitType;
    const config = RATE_LIMITS[limitType];
    
    if (!config) {
      console.error(`Unknown rate limit type: ${limitType}`);
      return { allowed: true, resetTime: 0, remaining: 1000 };
    }

    try {
      const now = Date.now();
      const windowStart = now - config.windowMs;
      
      // Get recent attempts for this identifier and limit type
      const recentAttempts = await ctx.runQuery(internal.rateLimiting.getRecentAttempts, {
        limitType,
        identifier: args.identifier,
        windowStart,
      });

      const attemptCount = recentAttempts.length;
      const allowed = attemptCount < config.limit;
      
      // Log this attempt
      await ctx.runMutation(internal.rateLimiting.logAttempt, {
        limitType,
        identifier: args.identifier,
        timestamp: now,
        allowed,
        metadata: args.metadata,
      });

      // Calculate reset time (next window)
      const resetTime = now + config.windowMs;
      const remaining = Math.max(0, config.limit - attemptCount - 1);

      return {
        allowed,
        resetTime,
        remaining,
        limit: config.limit,
        windowMs: config.windowMs,
      };
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Fail open - allow request but log the error
      return { allowed: true, resetTime: 0, remaining: 1000 };
    }
  },
});

/**
 * Get recent rate limit attempts for an identifier
 */
export const getRecentAttempts = internalQuery({
  args: {
    limitType: v.string(),
    identifier: v.string(),
    windowStart: v.number(),
  },
  handler: async (ctx, args) => {
    const key = `${args.limitType}:${args.identifier}`;
    
    return await ctx.db
      .query("rateLimitAttempts")
      .withIndex("by_key_and_time", q => 
        q.eq("key", key).gte("timestamp", args.windowStart)
      )
      .collect();
  },
});

/**
 * Log a rate limit attempt
 */
export const logAttempt = internalMutation({
  args: {
    limitType: v.string(),
    identifier: v.string(),
    timestamp: v.number(),
    allowed: v.boolean(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const key = `${args.limitType}:${args.identifier}`;
    
    await ctx.db.insert("rateLimitAttempts", {
      key,
      timestamp: args.timestamp,
      ip: args.metadata?.ip,
      userAgent: args.metadata?.userAgent,
      success: args.allowed,
      metadata: args.metadata,
    });
  },
});

/**
 * Clean up old rate limit records (run daily)
 */
export const cleanupOldAttempts = internalMutation({
  args: {
    maxAgeHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxAge = args.maxAgeHours || 24; // Default 24 hours
    const cutoffTime = Date.now() - (maxAge * 60 * 60 * 1000);
    
    console.log(`Cleaning up rate limit attempts older than ${maxAge} hours...`);
    
    const oldAttempts = await ctx.db
      .query("rateLimitAttempts")
      .withIndex("by_timestamp", q => q.lt("timestamp", cutoffTime))
      .collect();
    
    let deletedCount = 0;
    for (const attempt of oldAttempts) {
      await ctx.db.delete(attempt._id);
      deletedCount++;
    }
    
    console.log(`Cleaned up ${deletedCount} old rate limit attempts`);
    return { deletedCount };
  },
});

/**
 * Get rate limit statistics for monitoring
 */
export const getRateLimitStats = internalQuery({
  args: {
    hours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hours = args.hours || 24;
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    
    const attempts = await ctx.db
      .query("rateLimitAttempts")
      .withIndex("by_timestamp", q => q.gte("timestamp", cutoffTime))
      .collect();
    
    const stats = {
      totalAttempts: attempts.length,
      allowedAttempts: attempts.filter(a => a.success).length,
      blockedAttempts: attempts.filter(a => !a.success).length,
      uniqueIdentifiers: new Set(attempts.map(a => a.key.split(':')[1])).size,
      byLimitType: {} as Record<string, { total: number; blocked: number }>,
      topBlockedIdentifiers: [] as Array<{ identifier: string; blockedCount: number }>,
    };
    
    // Calculate stats by limit type
    for (const attempt of attempts) {
      const limitType = attempt.key.split(':')[0];
      if (!stats.byLimitType[limitType]) {
        stats.byLimitType[limitType] = { total: 0, blocked: 0 };
      }
      
      stats.byLimitType[limitType].total++;
      if (!attempt.success) {
        stats.byLimitType[limitType].blocked++;
      }
    }
    
    // Calculate top blocked identifiers
    const blockedByIdentifier = new Map<string, number>();
    for (const attempt of attempts.filter(a => !a.success)) {
      const identifier = attempt.key.split(':')[1];
      blockedByIdentifier.set(identifier, (blockedByIdentifier.get(identifier) || 0) + 1);
    }
    
    stats.topBlockedIdentifiers = Array.from(blockedByIdentifier.entries())
      .map(([identifier, blockedCount]) => ({ identifier, blockedCount }))
      .sort((a, b) => b.blockedCount - a.blockedCount)
      .slice(0, 10);
    
    return stats;
  },
});

/**
 * Check if an IP address should be blocked due to suspicious activity
 */
export const checkSuspiciousActivity = action({
  args: {
    ip: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      const lastHour = now - (60 * 60 * 1000);
      
      // Get all recent attempts from this IP
      const recentAttempts = await ctx.db
        .query("rateLimitAttempts")
        .withIndex("by_ip", q => q.eq("ip", args.ip))
        .filter(q => q.gte(q.field("timestamp"), lastHour))
        .collect();
      
      const totalAttempts = recentAttempts.length;
      const blockedAttempts = recentAttempts.filter(a => !a.success).length;
      const blockRate = totalAttempts > 0 ? blockedAttempts / totalAttempts : 0;
      
      // Suspicious patterns
      const isSuspicious = 
        totalAttempts > 500 || // Too many requests
        blockRate > 0.5 || // High block rate
        (blockedAttempts > 50 && blockRate > 0.3); // Many blocks with moderate rate
      
      if (isSuspicious) {
        console.warn(`Suspicious activity detected from IP ${args.ip}:`, {
          totalAttempts,
          blockedAttempts,
          blockRate,
          userAgent: args.userAgent,
        });
        
        // Log security incident
        await ctx.runMutation(internal.rateLimiting.logSecurityIncident, {
          ip: args.ip,
          userAgent: args.userAgent,
          incidentType: "suspicious_rate_limiting",
          details: {
            totalAttempts,
            blockedAttempts,
            blockRate,
            timeWindow: "1hour",
          },
        });
      }
      
      return {
        isSuspicious,
        totalAttempts,
        blockedAttempts,
        blockRate,
        recommendation: isSuspicious ? "block" : "allow",
      };
    } catch (error) {
      console.error("Suspicious activity check failed:", error);
      return {
        isSuspicious: false,
        totalAttempts: 0,
        blockedAttempts: 0,
        blockRate: 0,
        recommendation: "allow",
      };
    }
  },
});

/**
 * Log security incidents
 */
export const logSecurityIncident = internalMutation({
  args: {
    ip: v.string(),
    userAgent: v.optional(v.string()),
    incidentType: v.string(),
    details: v.any(),
  },
  handler: async (ctx, args) => {
    const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await ctx.db.insert("securityIncidents", {
      incidentId,
      type: args.incidentType,
      severity: "medium",
      description: `Rate limiting incident: ${args.incidentType}`,
      sourceIp: args.ip,
      userAgent: args.userAgent,
      status: "detected",
      detectedAt: Date.now(),
      evidence: args.details,
    });
    
    console.log(`Security incident logged: ${incidentId}`);
    return incidentId;
  },
});

/**
 * Middleware helper for HTTP actions to check rate limits
 */
export const withRateLimit = (
  limitType: RateLimitType,
  getIdentifier: (request: Request) => string
) => {
  return async (ctx: any, request: Request) => {
    const identifier = getIdentifier(request);
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const rateLimitResult = await ctx.runAction(internal.rateLimiting.checkRateLimit, {
      limitType,
      identifier,
      metadata: { ip, userAgent },
    });
    
    if (!rateLimitResult.allowed) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(rateLimitResult.windowMs / 1000).toString(),
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      });
    }
    
    // Add rate limit headers to successful responses
    const headers = {
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
    };
    
    return { rateLimitResult, headers };
  };
};

/**
 * Create a rate-limited version of any HTTP action
 */
export const rateLimit = (
  limitType: RateLimitType,
  getIdentifier: (request: Request) => string = (req) => req.headers.get('x-forwarded-for') || 'unknown'
) => {
  return withRateLimit(limitType, getIdentifier);
};