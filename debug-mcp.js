// MCP Debug Script - Test MCP tool functionality
import { experimental_createMCPClient } from "ai";

async function debugMCPTools() {
  console.log("🔍 Starting MCP Debug Session...");

  let mcpClient;

  try {
    // Test 1: Check environment variables
    console.log("\n1. Environment Variables:");
    console.log(
      "   FIRECRAWL_API_KEY:",
      process.env.FIRECRAWL_API_KEY ? "✅ Set" : "❌ Missing"
    );

    if (!process.env.FIRECRAWL_API_KEY) {
      console.log("   ⚠️  Set FIRECRAWL_API_KEY environment variable");
      return;
    }

    // Test 2: Create MCP client
    console.log("\n2. Creating MCP Client...");
    mcpClient = await experimental_createMCPClient({
      transport: {
        type: "sse",
        url: `https://mcp.firecrawl.dev/${process.env.FIRECRAWL_API_KEY}/sse`,
      },
    });
    console.log("   ✅ MCP Client created successfully");

    // Test 3: List available tools
    console.log("\n3. Listing Available Tools...");
    const tools = await mcpClient.tools();
    const toolNames = Object.keys(tools);
    console.log(`   Found ${toolNames.length} tools:`, toolNames);

    // Test 4: Inspect tool details
    console.log("\n4. Tool Details:");
    for (const [name, tool] of Object.entries(tools)) {
      console.log(`   📋 ${name}:`);
      console.log(`      Description: ${tool.description || "N/A"}`);
      console.log(
        `      Parameters: ${JSON.stringify(tool.parameters, null, 2)}`
      );
    }

    // Test 5: Test tool execution (if available)
    if (toolNames.includes("firecrawl_scrape")) {
      console.log("\n5. Testing Tool Execution:");
      console.log("   🧪 Testing firecrawl_scrape tool...");

      try {
        const testTool = tools.firecrawl_scrape;
        console.log("   Tool execute function:", typeof testTool.execute);

        if (testTool.execute) {
          console.log("   Attempting to execute test scrape...");
          const result = await testTool.execute({
            url: "https://example.com",
            formats: ["markdown"],
            onlyMainContent: true,
          });
          console.log("   ✅ Tool execution successful:", typeof result);
          console.log(
            "   Result preview:",
            JSON.stringify(result).substring(0, 200) + "..."
          );
        } else {
          console.log("   ❌ Tool execute function not available");
        }
      } catch (toolError) {
        console.log("   ❌ Tool execution failed:", toolError.message);
        console.log("   Error details:", toolError);
      }
    }

    // Test 6: Verify tool binding
    console.log("\n6. Tool Binding Verification:");
    for (const [name, tool] of Object.entries(tools)) {
      console.log(`   ${name}:`);
      console.log(`     - Has description: ${!!tool.description}`);
      console.log(`     - Has parameters: ${!!tool.parameters}`);
      console.log(`     - Has execute: ${!!tool.execute}`);
      console.log(`     - Execute type: ${typeof tool.execute}`);
    }
  } catch (error) {
    console.log("❌ Debug failed:", error.message);
    console.log("Full error:", error);
  } finally {
    // Test 7: Clean up
    if (mcpClient) {
      console.log("\n7. Cleaning up...");
      try {
        await mcpClient.close();
        console.log("   ✅ MCP Client closed successfully");
      } catch (closeError) {
        console.log("   ⚠️  Error closing client:", closeError.message);
      }
    }
  }
}

// Run debug
debugMCPTools().catch(console.error);
