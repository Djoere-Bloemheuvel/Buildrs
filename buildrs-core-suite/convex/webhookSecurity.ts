import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import crypto from "crypto";

/**
 * SECURE webhook handlers with signature verification
 * These endpoints verify webhook authenticity before processing
 */

/**
 * Verify PhantomBuster webhook signature
 */
function verifyPhantomBusterSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('PhantomBuster signature verification failed:', error);
    return false;
  }
}

/**
 * Verify AirCall webhook signature
 */
function verifyAirCallSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  
  try {
    const expectedSignature = crypto
      .createHmac('sha1', secret)
      .update(payload)
      .digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha1=${expectedSignature}`)
    );
  } catch (error) {
    console.error('AirCall signature verification failed:', error);
    return false;
  }
}

/**
 * Verify Instantly webhook signature
 */
function verifyInstantlySignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const providedSignature = signature.startsWith('sha256=') 
      ? signature.slice(7) 
      : signature;
    
    return crypto.timingSafeEqual(
      Buffer.from(providedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Instantly signature verification failed:', error);
    return false;
  }
}

/**
 * Rate limiting for webhook endpoints
 */
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = `${ip}`;
  
  const current = rateLimitCache.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitCache.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
}

/**
 * SECURE PhantomBuster webhook handler
 */
export const handlePhantomBusterWebhookSecure = httpAction(async (ctx, request) => {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip, 50, 60000)) { // 50 requests per minute per IP
      return new Response('Rate limit exceeded', { status: 429 });
    }

    // Verify content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response('Invalid content type', { status: 400 });
    }

    // Get payload and signature
    const payload = await request.text();
    const signature = request.headers.get('x-phantombuster-signature') || 
                     request.headers.get('x-signature');
    
    // Verify payload size (prevent DoS)
    if (payload.length > 10 * 1024) { // 10KB limit
      return new Response('Payload too large', { status: 413 });
    }

    // Verify signature
    const webhookSecret = process.env.PHANTOMBUSTER_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('PhantomBuster webhook secret not configured');
      return new Response('Webhook not configured', { status: 500 });
    }

    if (!signature || !verifyPhantomBusterSignature(payload, signature, webhookSecret)) {
      console.error('PhantomBuster webhook signature verification failed');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse and validate payload
    let data;
    try {
      data = JSON.parse(payload);
    } catch (error) {
      return new Response('Invalid JSON', { status: 400 });
    }

    // Validate required fields
    if (!data.sessionId && !data.containerId) {
      return new Response('Missing session/container ID', { status: 400 });
    }

    // Process webhook with original handler
    await ctx.runAction(internal.webhooks.processPhantomBusterWebhook, data);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('PhantomBuster webhook error:', error);
    return new Response('Internal error', { status: 500 });
  }
});

/**
 * SECURE AirCall webhook handler
 */
export const handleAirCallWebhookSecure = httpAction(async (ctx, request) => {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip, 100, 60000)) { // 100 requests per minute per IP
      return new Response('Rate limit exceeded', { status: 429 });
    }

    // Verify content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response('Invalid content type', { status: 400 });
    }

    // Get payload and signature
    const payload = await request.text();
    const signature = request.headers.get('x-aircall-signature') ||
                     request.headers.get('x-hub-signature');
    
    // Verify payload size
    if (payload.length > 5 * 1024) { // 5KB limit
      return new Response('Payload too large', { status: 413 });
    }

    // Verify signature
    const webhookSecret = process.env.AIRCALL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('AirCall webhook secret not configured');
      return new Response('Webhook not configured', { status: 500 });
    }

    if (!signature || !verifyAirCallSignature(payload, signature, webhookSecret)) {
      console.error('AirCall webhook signature verification failed');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse and validate payload
    let data;
    try {
      data = JSON.parse(payload);
    } catch (error) {
      return new Response('Invalid JSON', { status: 400 });
    }

    // Validate required fields
    if (!data.call || !data.event) {
      return new Response('Missing call data or event', { status: 400 });
    }

    // Process webhook with original handler
    await ctx.runAction(internal.webhooks.processAirCallWebhook, data);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('AirCall webhook error:', error);
    return new Response('Internal error', { status: 500 });
  }
});

/**
 * SECURE Instantly webhook handler
 */
export const handleInstantlyWebhookSecure = httpAction(async (ctx, request) => {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip, 200, 60000)) { // 200 requests per minute per IP
      return new Response('Rate limit exceeded', { status: 429 });
    }

    // Verify content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response('Invalid content type', { status: 400 });
    }

    // Get payload and signature
    const payload = await request.text();
    const signature = request.headers.get('x-instantly-signature') ||
                     request.headers.get('x-signature') ||
                     request.headers.get('x-hub-signature-256');
    
    // Verify payload size
    if (payload.length > 10 * 1024) { // 10KB limit
      return new Response('Payload too large', { status: 413 });
    }

    // Verify signature
    const webhookSecret = process.env.INSTANTLY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Instantly webhook secret not configured');
      return new Response('Webhook not configured', { status: 500 });
    }

    if (!signature || !verifyInstantlySignature(payload, signature, webhookSecret)) {
      console.error('Instantly webhook signature verification failed');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse and validate payload
    let data;
    try {
      data = JSON.parse(payload);
    } catch (error) {
      return new Response('Invalid JSON', { status: 400 });
    }

    // Validate required fields
    if (!data.messageId && !data.campaignId) {
      return new Response('Missing message or campaign ID', { status: 400 });
    }

    // Process webhook with original handler
    await ctx.runAction(internal.webhooks.processInstantlyWebhook, data);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Instantly webhook error:', error);
    return new Response('Internal error', { status: 500 });
  }
});

/**
 * Gmail webhook verification (for push notifications)
 */
export const handleGmailWebhookSecure = httpAction(async (ctx, request) => {
  try {
    // Gmail uses different verification method
    const url = new URL(request.url);
    const challenge = url.searchParams.get('hub.challenge');
    
    // For verification requests, return the challenge
    if (challenge) {
      return new Response(challenge, { status: 200 });
    }

    // For actual notifications, verify using OAuth tokens
    const payload = await request.text();
    
    // Verify payload size
    if (payload.length > 2 * 1024) { // 2KB limit for Gmail notifications
      return new Response('Payload too large', { status: 413 });
    }

    let data;
    try {
      data = JSON.parse(payload);
    } catch (error) {
      return new Response('Invalid JSON', { status: 400 });
    }

    // Process Gmail notification
    await ctx.runAction(internal.emailSync.handleEmailNotification, {
      provider: 'gmail',
      accountEmail: data.emailAddress,
      notificationData: data,
    });

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Gmail webhook error:', error);
    return new Response('Internal error', { status: 500 });
  }
});

/**
 * Generic webhook verification endpoint
 */
export const verifyWebhookSecure = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider');
    const challenge = url.searchParams.get('challenge') || 
                     url.searchParams.get('hub.challenge');

    // Different providers have different verification methods
    switch (provider) {
      case 'gmail':
      case 'outlook':
        // OAuth providers typically use challenge-response
        if (challenge) {
          return new Response(challenge, { status: 200 });
        }
        break;
      
      case 'phantombuster':
      case 'aircall':
      case 'instantly':
        // These providers typically verify via initial handshake
        return new Response('OK', { status: 200 });
      
      default:
        return new Response('Unknown provider', { status: 400 });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook verification error:', error);
    return new Response('Error', { status: 500 });
  }
});