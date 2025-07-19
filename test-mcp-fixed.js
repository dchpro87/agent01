// Test MCP tools with explicit schemas - Simple Node.js test
import { experimental_createMCPClient } from "ai";
import { z } from "zod";

// Load environment variables manually for testing
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file
dotenv.config({ path: path.join(__dirname, ".env.local") });

async function testMCPToolsFixed() {
  console.log("🧪 Testing Fixed MCP Tools Implementation...");

  let mcpClient;

  try {
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      console.log("❌ FIRECRAWL_API_KEY not found");
      return;
    }

    console.log("✅ API Key found:", firecrawlApiKey.substring(0, 6) + "...");

    // Create MCP client
    console.log("🔄 Creating MCP client...");
    mcpClient = await experimental_createMCPClient({
      transport: {
        type: "sse",
        url: `https://mcp.firecrawl.dev/${firecrawlApiKey}/sse`,
      },
    });
    console.log("✅ MCP Client created");

    // Get tools with explicit schemas
    console.log("🔄 Getting tools with explicit schemas...");
    const tools = await mcpClient.tools({
      schemas: {
        firecrawl_scrape: {
          parameters: z.object({
            url: z.string().describe("The URL to scrape"),
            formats: z.array(z.string()).optional().describe("Output formats"),
            onlyMainContent: z
              .boolean()
              .optional()
              .describe("Extract only main content"),
          }),
        },
        firecrawl_search: {
          parameters: z.object({
            query: z.string().describe("Search query"),
            limit: z.number().optional().describe("Number of results"),
          }),
        },
      },
    });

    console.log("✅ Tools retrieved:", Object.keys(tools));

    // Test a simple tool call
    if (tools.firecrawl_scrape && tools.firecrawl_scrape.execute) {
      console.log("🧪 Testing firecrawl_scrape execution...");

      const result = await tools.firecrawl_scrape.execute({
        url: "https://example.com",
        formats: ["markdown"],
        onlyMainContent: true,
      });

      console.log("✅ Tool execution successful!");
      console.log("Result type:", typeof result);
      console.log(
        "Result preview:",
        JSON.stringify(result).substring(0, 200) + "..."
      );
    } else {
      console.log("❌ firecrawl_scrape tool or execute function not available");
    }
  } catch (error) {
    console.log("❌ Test failed:", error.message);
    console.log("Stack trace:", error.stack);
  } finally {
    if (mcpClient) {
      console.log("🧹 Closing MCP client...");
      await mcpClient.close();
      console.log("✅ MCP client closed");
    }
  }
}

testMCPToolsFixed().catch(console.error);
