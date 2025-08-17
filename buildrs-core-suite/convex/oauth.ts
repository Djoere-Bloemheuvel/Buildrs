import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * SECURE OAuth token exchange endpoints
 * These endpoints handle OAuth token exchange server-side to protect client secrets
 */

export const exchangeGmailToken = httpAction(async (ctx, request) => {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = await ctx.runAction(internal.rateLimiting.checkRateLimit, {
      limitType: "oauth_token_exchange",
      identifier: ip,
      metadata: { 
        ip, 
        userAgent: request.headers.get('user-agent'),
        endpoint: 'gmail_exchange'
      },
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
    
    const { code, clientId, redirectUri, state } = await request.json();
    
    // Server-side OAuth credentials (secure)
    const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
    if (!CLIENT_SECRET) {
      return new Response("Gmail OAuth not configured", { status: 500 });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Gmail token exchange failed:', errorData);
      return new Response(JSON.stringify({ 
        error: 'token_exchange_failed',
        details: errorData.error_description || errorData.error 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const tokens = await tokenResponse.json();

    // Get user email address
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return new Response("Failed to get user info", { status: 400 });
    }

    const userInfo = await userResponse.json();
    
    // Parse state to get client info
    let stateData;
    try {
      stateData = JSON.parse(state);
    } catch {
      return new Response("Invalid state parameter", { status: 400 });
    }

    // Create email account in database
    try {
      const emailAccountId = await ctx.runMutation(internal.emailAccounts.createEmailAccount, {
        clientId: stateData.clientId,
        email: userInfo.email,
        provider: "gmail",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: Date.now() + (tokens.expires_in * 1000),
        settings: stateData.settings,
      });

      return new Response(JSON.stringify({
        success: true,
        email: userInfo.email,
        emailAccountId,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Failed to create email account:', error);
      return new Response(JSON.stringify({
        error: 'account_creation_failed',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Gmail OAuth error:', error);
    return new Response(JSON.stringify({
      error: 'internal_error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export const exchangeOutlookToken = httpAction(async (ctx, request) => {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = await ctx.runAction(internal.rateLimiting.checkRateLimit, {
      limitType: "oauth_token_exchange",
      identifier: ip,
      metadata: { 
        ip, 
        userAgent: request.headers.get('user-agent'),
        endpoint: 'outlook_exchange'
      },
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
    
    const { code, clientId, redirectUri, state } = await request.json();
    
    // Server-side OAuth credentials (secure)
    const CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET;
    const TENANT_ID = process.env.OUTLOOK_TENANT_ID || 'common';
    
    if (!CLIENT_SECRET) {
      return new Response("Outlook OAuth not configured", { status: 500 });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        scope: 'https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Outlook token exchange failed:', errorData);
      return new Response(JSON.stringify({ 
        error: 'token_exchange_failed',
        details: errorData.error_description || errorData.error 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const tokens = await tokenResponse.json();

    // Get user email address
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return new Response("Failed to get user info", { status: 400 });
    }

    const userInfo = await userResponse.json();
    const userEmail = userInfo.mail || userInfo.userPrincipalName;
    
    // Parse state to get client info
    let stateData;
    try {
      stateData = JSON.parse(state);
    } catch {
      return new Response("Invalid state parameter", { status: 400 });
    }

    // Create email account in database
    try {
      const emailAccountId = await ctx.runMutation(internal.emailAccounts.createEmailAccount, {
        clientId: stateData.clientId,
        email: userEmail,
        provider: "outlook",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: Date.now() + (tokens.expires_in * 1000),
        settings: stateData.settings,
      });

      return new Response(JSON.stringify({
        success: true,
        email: userEmail,
        emailAccountId,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Failed to create email account:', error);
      return new Response(JSON.stringify({
        error: 'account_creation_failed',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Outlook OAuth error:', error);
    return new Response(JSON.stringify({
      error: 'internal_error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Refresh OAuth tokens securely on the server
 */
export const refreshGmailToken = httpAction(async (ctx, request) => {
  try {
    const { refreshToken, emailAccountId } = await request.json();
    
    const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
    const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return new Response("Gmail OAuth not configured", { status: 500 });
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return new Response(JSON.stringify({ 
        error: 'token_refresh_failed',
        details: errorData.error_description || errorData.error 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const tokens = await tokenResponse.json();

    // Update the email account with new tokens
    await ctx.runMutation(internal.emailAccounts.updateEmailAccount, {
      emailAccountId,
      accessToken: tokens.access_token,
      tokenExpiresAt: Date.now() + (tokens.expires_in * 1000),
      refreshToken: tokens.refresh_token || refreshToken, // Use new refresh token if provided
      isValid: true,
    });

    return new Response(JSON.stringify({
      success: true,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Gmail token refresh error:', error);
    return new Response(JSON.stringify({
      error: 'internal_error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export const refreshOutlookToken = httpAction(async (ctx, request) => {
  try {
    const { refreshToken, emailAccountId } = await request.json();
    
    const CLIENT_ID = process.env.OUTLOOK_CLIENT_ID;
    const CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET;
    const TENANT_ID = process.env.OUTLOOK_TENANT_ID || 'common';
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return new Response("Outlook OAuth not configured", { status: 500 });
    }

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return new Response(JSON.stringify({ 
        error: 'token_refresh_failed',
        details: errorData.error_description || errorData.error 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const tokens = await tokenResponse.json();

    // Update the email account with new tokens
    await ctx.runMutation(internal.emailAccounts.updateEmailAccount, {
      emailAccountId,
      accessToken: tokens.access_token,
      tokenExpiresAt: Date.now() + (tokens.expires_in * 1000),
      refreshToken: tokens.refresh_token || refreshToken,
      isValid: true,
    });

    return new Response(JSON.stringify({
      success: true,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Outlook token refresh error:', error);
    return new Response(JSON.stringify({
      error: 'internal_error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});