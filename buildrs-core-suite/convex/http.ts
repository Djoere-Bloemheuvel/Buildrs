import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Debug endpoint to see what N8N is sending
http.route({
  path: "/debug-request",
  method: "POST", 
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.text();
      console.log("🔍 RAW BODY:", body);
      
      let parsedData;
      try {
        parsedData = JSON.parse(body);
      } catch (e) {
        parsedData = "JSON_PARSE_ERROR";
      }
      
      return new Response(
        JSON.stringify({
          raw_body: body,
          parsed_data: parsedData,
          body_length: body.length,
          content_type: request.headers.get("content-type")
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// Simple HTTP endpoint for N8N lead updates
http.route({
  path: "/update-lead-function-groups",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Parse request body
      const body = await request.text();
      const data = JSON.parse(body);
      
      console.log("📨 HTTP Request received:", data);
      console.log("📨 Request type:", typeof data);
      console.log("📨 Is array:", Array.isArray(data));
      if (Array.isArray(data)) {
        console.log("📨 Array length:", data.length);
        console.log("📨 First item:", data[0]);
      }
      
      // Handle both single object and array input
      let dataArray;
      if (Array.isArray(data)) {
        dataArray = data;
      } else if (data && typeof data === 'object') {
        // Single object, wrap in array
        dataArray = [data];
      } else {
        return new Response(
          JSON.stringify({ error: "Expected object or array of lead updates" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Transform to expected format with validation
      const leadUpdates = dataArray
        .filter(item => {
          const hasFunction = item && (item["Function Group"] || item.functionGroup);
          const hasLeadId = item && item.lead_id;
          console.log(`🔍 Filtering item:`, { item, hasFunction, hasLeadId });
          return hasFunction && hasLeadId;
        })
        .map(item => ({
          functionGroup: item["Function Group"] || item.functionGroup,
          lead_id: item.lead_id
        }));
      
      // Check if we have valid data after filtering
      if (leadUpdates.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: "No valid lead updates found. Expected objects with 'Function Group' and 'lead_id' fields.",
            received: dataArray
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Call the action
      const result = await ctx.runAction(api.leadUpdater.updateLeadFunctionGroups, {
        leadUpdates
      });
      
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
      
    } catch (error) {
      console.error("💥 HTTP Error:", error);
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : "Internal error" 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

export default http;