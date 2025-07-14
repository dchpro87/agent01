import { z } from "zod";
import { getJson } from "serpapi";
import { APP_CONFIG } from "@/constraints/app-config";
import { formatSearchResults } from "@/utils/search-formatter";
import type { SearchParams } from "@/types";

/** Web search tool using SerpApi to search across multiple search engines */
export const searchWeb = {
  description:
    "When requiring additional information, search the web across various search engines (Google, Bing, Yahoo, etc.) using SerpApi. This tool can perform web searches, find specific information, get search results, news, images, shopping results, and more. Useful for finding current information, research, competitive analysis, and content discovery.",
  parameters: z.object({
    query: z.string().describe("The search query or keywords to search for"),
    engine: z
      .enum([
        "google",
        "bing",
        "yahoo",
        "duckduckgo",
        "yandex",
        "baidu",
        "google_news",
        "google_scholar",
        "google_shopping",
        "google_images",
        "youtube",
      ])
      .optional()
      .default("google")
      .describe("The search engine to use for the search"),
    location: z
      .string()
      .optional()
      .describe(
        "Location for localized search results (e.g., 'Austin, Texas', 'London, UK')"
      ),
    resultsCount: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe("Number of search results to return (1-100)"),
    language: z
      .string()
      .optional()
      .describe("Language code for search results (e.g., 'en', 'es', 'fr')"),
    safeSearch: z
      .enum(["active", "moderate", "off"])
      .optional()
      .default("moderate")
      .describe("Safe search filter level"),
    timeframe: z
      .enum(["hour", "day", "week", "month", "year"])
      .optional()
      .describe("Time filter for recent results (only for supported engines)"),
  }),
  execute: async ({
    query,
    engine = "google",
    location,
    resultsCount = 10,
    language,
    safeSearch = "moderate",
    timeframe,
  }: {
    query: string;
    engine?: string;
    location?: string;
    resultsCount?: number;
    language?: string;
    safeSearch?: "active" | "moderate" | "off";
    timeframe?: "hour" | "day" | "week" | "month" | "year";
  }) => {
    console.log("🔧 searchWeb tool called with:", {
      query,
      engine,
      location,
      resultsCount,
      language,
      safeSearch,
      timeframe,
    });
    try {
      // Get API key from app configuration
      const apiKey = APP_CONFIG.serpApi?.apiKey;

      if (!apiKey) {
        const errorResult =
          "SerpApi API key not found. Please add SERP_API_KEY to your environment variables or update the app configuration.";
        console.log("🔧 searchWeb tool error:", errorResult);
        return errorResult;
      }

      // Build search parameters
      const searchParams: SearchParams = {
        engine: engine,
        api_key: apiKey,
        q: query,
        num: resultsCount,
      };

      // Add optional parameters
      if (location) {
        searchParams.location = location;
      }

      if (language) {
        searchParams.hl = language;
      }

      if (safeSearch !== "moderate") {
        searchParams.safe = safeSearch;
      }

      // Add time-based filtering for supported engines
      if (timeframe && (engine === "google" || engine === "google_news")) {
        const timeMapping = {
          hour: "h",
          day: "d",
          week: "w",
          month: "m",
          year: "y",
        };
        searchParams.tbs = `qdr:${timeMapping[timeframe]}`;
      }

      console.log("🔧 Calling SerpApi with parameters:", searchParams);

      // Perform the search
      const response = await getJson(searchParams);

      console.log("🔧 SerpApi response received");

      // Format the response based on the engine type
      const formattedResults = formatSearchResults(response, engine);

      const result = `🔍 Web Search Results for "${query}" using ${engine.toUpperCase()}:

${formattedResults}

📊 Search Metadata:
• Engine: ${engine}
• Query: ${query}
• Location: ${location || "Global"}
• Results: ${resultsCount}
• Search ID: ${response.search_metadata?.id || "N/A"}
• Processing Time: ${response.search_metadata?.processing_time_ms || "N/A"}ms
• Timestamp: ${new Date().toLocaleString()}

Powered by SerpApi`;

      console.log("🔧 searchWeb tool result length:", result.length);
      return result;
    } catch (error) {
      const errorResult = `Error performing web search: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      console.log("🔧 searchWeb tool error:", errorResult);
      return errorResult;
    }
  },
};
