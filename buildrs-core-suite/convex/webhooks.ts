import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Webhook handlers for various communication providers
 */

// Instantly.ai webhook handler
export const handleInstantlyWebhook = httpAction(async (ctx, request) => {
  try {
    const data = await request.json();
    console.log("Instantly webhook received:", data);

    // Find communication by Instantly message ID
    const communications = await ctx.runQuery(internal.communications.findCommunicationByMessageId, {
      messageId: data.messageId,
      provider: "instantly",
    });

    if (communications) {
      // Update communication status based on event
      let status = data.event;
      const metadata: any = { ...communications.metadata };

      // Add timestamp for tracking events
      switch (data.event) {
        case "opened":
          metadata.openedAt = Date.now();
          break;
        case "clicked":
          metadata.clickedAt = Date.now();
          break;
        case "replied":
          metadata.repliedAt = Date.now();
          if (data.replyContent) {
            metadata.replyContent = data.replyContent;
          }
          break;
        case "bounced":
        case "unsubscribed":
          // These are final states
          break;
      }

      // Add tracking information
      if (data.userAgent) metadata.userAgent = data.userAgent;
      if (data.ipAddress) metadata.ipAddress = data.ipAddress;
      if (data.location) metadata.location = data.location;

      await ctx.runMutation(internal.communications.updateCommunicationStatus, {
        communicationId: communications._id,
        status,
        metadata,
      });

      console.log(`Updated communication ${communications._id} with status: ${status}`);
    } else {
      console.log(`No communication found for Instantly message ID: ${data.messageId}`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing Instantly webhook:", error);
    return new Response("Error", { status: 500 });
  }
});

// PhantomBuster webhook handler
export const handlePhantomBusterWebhook = httpAction(async (ctx, request) => {
  try {
    const data = await request.json();
    console.log("PhantomBuster webhook received:", data);

    // Find communication by PhantomBuster session ID
    const communications = await ctx.runQuery(internal.communications.findCommunicationByMessageId, {
      messageId: data.sessionId,
      provider: "phantombuster",
    });

    if (communications) {
      let status = "sent";
      const metadata: any = { ...communications.metadata };

      // Update based on PhantomBuster result
      if (data.status === "finished" && data.result) {
        if (data.result.connectionSent) {
          status = "connected";
          metadata.connectionAccepted = true;
        }
        if (data.result.messageSent) {
          metadata.messageDelivered = true;
        }
        if (data.result.error) {
          status = "failed";
          metadata.error = data.result.error;
        }
      } else if (data.status === "error") {
        status = "failed";
        metadata.error = "PhantomBuster execution failed";
      }

      metadata.phantomBusterProgress = data.progress;
      metadata.phantomBusterStatus = data.status;

      await ctx.runMutation(internal.communications.updateCommunicationStatus, {
        communicationId: communications._id,
        status,
        metadata,
      });

      console.log(`Updated communication ${communications._id} with status: ${status}`);
    } else {
      console.log(`No communication found for PhantomBuster session ID: ${data.sessionId}`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing PhantomBuster webhook:", error);
    return new Response("Error", { status: 500 });
  }
});

// AirCall webhook handler
export const handleAirCallWebhook = httpAction(async (ctx, request) => {
  try {
    const data = await request.json();
    console.log("AirCall webhook received:", data);

    const { call, event } = data;
    
    // Find contact by phone number
    const phoneNumber = call.contact?.phone_number || call.number?.digits;
    if (!phoneNumber) {
      console.log("No phone number found in AirCall webhook");
      return new Response("OK", { status: 200 });
    }

    // This is a simplified approach - in practice you'd want to identify the client
    // For now, we'll skip client identification and just log the event
    console.log(`AirCall ${event} for call ${call.id} to/from ${phoneNumber}`);

    // The actual implementation would involve:
    // 1. Finding the client based on the AirCall account/webhook configuration
    // 2. Finding the contact by phone number within that client's data
    // 3. Creating or updating the communication record

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing AirCall webhook:", error);
    return new Response("Error", { status: 500 });
  }
});

// Gmail/Outlook webhook handler (for real-time email monitoring)
export const handleEmailWebhook = httpAction(async (ctx, request) => {
  try {
    const data = await request.json();
    console.log("Email webhook received:", data);

    // This would be used for real-time email monitoring
    // Implementation depends on the specific email provider's webhook format
    // Gmail uses pub/sub notifications, Outlook uses webhooks

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing email webhook:", error);
    return new Response("Error", { status: 500 });
  }
});

// Generic webhook verification handler
export const verifyWebhook = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider");
    const challenge = url.searchParams.get("challenge");

    // Different providers have different verification methods
    switch (provider) {
      case "instantly":
        // Instantly typically doesn't require verification
        return new Response("OK", { status: 200 });
      
      case "phantombuster":
        // PhantomBuster might require API key verification
        return new Response("OK", { status: 200 });
      
      case "aircall":
        // AirCall might require signature verification
        return new Response("OK", { status: 200 });
      
      case "gmail":
        // Gmail push notifications require challenge response
        if (challenge) {
          return new Response(challenge, { status: 200 });
        }
        break;
      
      default:
        return new Response("Unknown provider", { status: 400 });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return new Response("Error", { status: 500 });
  }
});