// Simple test to verify MCP connection handling
const { mcpClientManager } = require("./dist/lib/mcp-client.js");

async function testMCPConnection() {
  console.log("🧪 Testing MCP connection handling...");

  try {
    // Test 1: Initialize clients
    console.log("1. Initializing MCP clients...");
    await mcpClientManager.initialize();

    // Test 2: Get tools
    console.log("2. Getting MCP tools...");
    const tools = await mcpClientManager.getAllTools();
    console.log(
      `   Found ${Object.keys(tools).length} tools:`,
      Object.keys(tools)
    );

    // Test 3: Health check
    console.log("3. Checking health status...");
    const health = await mcpClientManager.getHealthStatus();
    console.log("   Health status:", health);

    // Test 4: Test graceful shutdown
    console.log("4. Testing graceful shutdown...");
    await mcpClientManager.shutdown();
    console.log("   ✅ Graceful shutdown completed");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run test
testMCPConnection().catch(console.error);
