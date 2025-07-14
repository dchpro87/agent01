import { z } from "zod";
import { getJson } from "serpapi";
import { APP_CONFIG } from "@/constraints/app-config";

// Type definitions for SerpApi responses
interface SearchResult {
  title?: string;
  snippet?: string;
  description?: string;
  link?: string;
  url?: string;
  publication_info?: {
    authors?: string;
    summary?: string;
  };
}

interface NewsResult {
  title?: string;
  snippet?: string;
  date?: string;
  source?: string;
  link?: string;
}

interface ShoppingResult {
  title?: string;
  price?: string;
  rating?: string;
  source?: string;
  link?: string;
}

interface ImageResult {
  title?: string;
  original?: {
    width?: string;
    height?: string;
    link?: string;
  };
  source?: string;
}

interface VideoResult {
  title?: string;
  channel?: string;
  duration?: string;
  views?: string;
  published_date?: string;
  link?: string;
}

interface SerpApiResponse {
  organic_results?: SearchResult[];
  news_results?: NewsResult[];
  shopping_results?: ShoppingResult[];
  images_results?: ImageResult[];
  video_results?: VideoResult[];
  answer_box?: {
    answer?: string;
    snippet?: string;
    link?: string;
  };
  knowledge_graph?: {
    title?: string;
    description?: string;
    website?: string;
  };
  related_questions?: Array<{ question: string }>;
  total_results?: number;
  search_metadata?: {
    id?: string;
    processing_time_ms?: number;
  };
}

interface SearchParams {
  engine: string;
  api_key: string;
  q: string;
  num: number;
  location?: string;
  hl?: string;
  safe?: string;
  tbs?: string;
  [key: string]: string | number | undefined; // Allow additional properties
}

// Helper function to format search results based on engine type
function formatSearchResults(
  response: SerpApiResponse,
  engine: string
): string {
  let formatted = "";

  try {
    switch (engine) {
      case "google":
      case "bing":
      case "yahoo":
      case "duckduckgo":
        // Standard web search results
        if (response.organic_results && response.organic_results.length > 0) {
          formatted += "🌐 **Web Results:**\n";
          response.organic_results
            .slice(0, 10)
            .forEach((result: SearchResult, index: number) => {
              formatted += `\n${index + 1}. **${
                result.title || "No title"
              }**\n`;
              formatted += `   ${
                result.snippet || result.description || "No description"
              }\n`;
              formatted += `   🔗 ${result.link || result.url || "No URL"}\n`;
            });
        }

        // Answer box/featured snippet
        if (response.answer_box) {
          formatted += "\n💡 **Featured Answer:**\n";
          formatted +=
            `${response.answer_box.answer}` ||
            `${response.answer_box.snippet}` ||
            "No answer available";
          formatted += `\n`;
          if (response.answer_box.link) {
            formatted += `🔗 Source: ${response.answer_box.link}\n`;
          }
        }

        // Knowledge graph
        if (response.knowledge_graph) {
          formatted += "\n📚 **Knowledge Graph:**\n";
          formatted += `**${response.knowledge_graph.title || "No title"}**\n`;
          formatted +=
            `${response.knowledge_graph.description}` || "No description";
          formatted += `\n`;
          if (response.knowledge_graph.website) {
            formatted += `🌐 Website: ${response.knowledge_graph.website}\n`;
          }
        }

        // Related questions
        if (
          response.related_questions &&
          response.related_questions.length > 0
        ) {
          formatted += "\n❓ **Related Questions:**\n";
          response.related_questions
            .slice(0, 3)
            .forEach((q: { question: string }, index: number) => {
              formatted += `${index + 1}. ${q.question}\n`;
            });
        }
        break;

      case "google_news":
        if (response.news_results && response.news_results.length > 0) {
          formatted += "📰 **News Results:**\n";
          response.news_results
            .slice(0, 10)
            .forEach((article: NewsResult, index: number) => {
              formatted += `\n${index + 1}. **${
                article.title || "No title"
              }**\n`;
              formatted += `   ${article.snippet || "No snippet"}\n`;
              formatted += `   📅 ${article.date || "No date"}\n`;
              formatted += `   📰 Source: ${
                article.source || "Unknown source"
              }\n`;
              formatted += `   🔗 ${article.link || "No URL"}\n`;
            });
        }
        break;

      case "google_shopping":
        if (response.shopping_results && response.shopping_results.length > 0) {
          formatted += "🛒 **Shopping Results:**\n";
          response.shopping_results
            .slice(0, 10)
            .forEach((product: ShoppingResult, index: number) => {
              formatted += `\n${index + 1}. **${
                product.title || "No title"
              }**\n`;
              formatted += `   💰 Price: ${
                product.price || "Price not available"
              }\n`;
              formatted += `   ⭐ Rating: ${product.rating || "No rating"}\n`;
              formatted += `   🏪 Store: ${
                product.source || "Unknown store"
              }\n`;
              formatted += `   🔗 ${product.link || "No URL"}\n`;
            });
        }
        break;

      case "google_images":
        if (response.images_results && response.images_results.length > 0) {
          formatted += "🖼️ **Image Results:**\n";
          response.images_results
            .slice(0, 10)
            .forEach((image: ImageResult, index: number) => {
              formatted += `\n${index + 1}. **${image.title || "No title"}**\n`;
              formatted += `   📏 Size: ${image.original?.width || "Unknown"}x${
                image.original?.height || "Unknown"
              }\n`;
              formatted += `   🔗 Image: ${image.original?.link || "No URL"}\n`;
              formatted += `   🌐 Source: ${
                image.source || "Unknown source"
              }\n`;
            });
        }
        break;

      case "youtube":
        if (response.video_results && response.video_results.length > 0) {
          formatted += "🎥 **Video Results:**\n";
          response.video_results
            .slice(0, 10)
            .forEach((video: VideoResult, index: number) => {
              formatted += `\n${index + 1}. **${video.title || "No title"}**\n`;
              formatted += `   📺 Channel: ${
                video.channel || "Unknown channel"
              }\n`;
              formatted += `   ⏱️ Duration: ${
                video.duration || "Unknown duration"
              }\n`;
              formatted += `   👀 Views: ${video.views || "Unknown views"}\n`;
              formatted += `   📅 Published: ${
                video.published_date || "Unknown date"
              }\n`;
              formatted += `   🔗 ${video.link || "No URL"}\n`;
            });
        }
        break;

      case "google_scholar":
        if (response.organic_results && response.organic_results.length > 0) {
          formatted += "🎓 **Academic Results:**\n";
          response.organic_results
            .slice(0, 10)
            .forEach((paper: SearchResult, index: number) => {
              formatted += `\n${index + 1}. **${paper.title || "No title"}**\n`;
              formatted += `   ✍️ Authors: ${
                paper.publication_info?.authors || "Unknown authors"
              }\n`;
              formatted += `   📚 Publication: ${
                paper.publication_info?.summary || "Unknown publication"
              }\n`;
              formatted += `   📄 Snippet: ${paper.snippet || "No snippet"}\n`;
              formatted += `   🔗 ${paper.link || "No URL"}\n`;
            });
        }
        break;

      default:
        // Fallback for other engines
        if (response.organic_results && response.organic_results.length > 0) {
          formatted += "🔍 **Search Results:**\n";
          response.organic_results
            .slice(0, 10)
            .forEach((result: SearchResult, index: number) => {
              formatted += `\n${index + 1}. **${
                result.title || "No title"
              }**\n`;
              formatted += `   ${
                result.snippet || result.description || "No description"
              }\n`;
              formatted += `   🔗 ${result.link || result.url || "No URL"}\n`;
            });
        }
    }

    // Add additional info if available
    if (response.total_results) {
      formatted += `\n📊 Total Results Found: ${response.total_results.toLocaleString()}\n`;
    }

    if (!formatted.trim()) {
      formatted = "No results found for this query.";
    }
  } catch (error) {
    formatted = `Error formatting results: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }

  return formatted;
}

export const tools = {
  /** Get the current date and time */
  getCurrentTime: {
    description:
      "Get the current date and time. Use this tool when the user asks about the current date, time, or any time-related information. After calling this tool, provide the answer directly to the user without additional thinking.",
    parameters: z.object({
      timezone: z
        .string()
        .optional()
        .describe(
          'The timezone to get the time for (e.g., "America/New_York", "Europe/London"). Leave empty for local time.'
        ),
    }),
    execute: async ({ timezone }: { timezone?: string }) => {
      console.log("🔧 getCurrentTime tool called with:", { timezone });
      try {
        const now = new Date();

        const options: Intl.DateTimeFormatOptions = {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          weekday: "long",
          ...(timezone && { timeZone: timezone }),
        };
        const timeString = now.toLocaleString("en-US", options);

        const timezoneInfo = timezone ? ` in ${timezone}` : " (local time)";
        const result = `The current date and time${timezoneInfo} is: ${timeString}`;
        console.log("🔧 getCurrentTime tool result:", result);
        return result;
      } catch (error) {
        const errorResult = `Error getting time: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.log("🔧 getCurrentTime tool error:", errorResult);
        return errorResult;
      }
    },
  },

  /** Calculate Body Mass Index (BMI) */
  calculateBMI: {
    description:
      "Calculate Body Mass Index (BMI) based on height and weight. BMI is calculated as weight (kg) divided by height (m) squared. The result includes BMI value and category classification.",
    parameters: z.object({
      weight: z.number().positive().describe("Weight in kilograms (kg)"),
      height: z.number().positive().describe("Height in meters (m)"),
      unit: z
        .enum(["metric", "imperial"])
        .optional()
        .default("metric")
        .describe("Unit system: 'metric' for kg/m or 'imperial' for lbs/ft"),
    }),
    execute: async ({
      weight,
      height,
      unit = "metric",
    }: {
      weight: number;
      height: number;
      unit?: "metric" | "imperial";
    }) => {
      console.log("🔧 calculateBMI tool called with:", {
        weight,
        height,
        unit,
      });
      try {
        let weightKg = weight;
        let heightM = height;

        // Convert imperial units to metric if needed
        if (unit === "imperial") {
          weightKg = weight * 0.453592; // lbs to kg
          heightM = height * 0.3048; // ft to m
        }

        // Calculate BMI
        const bmi = weightKg / (heightM * heightM);
        const bmiRounded = Math.round(bmi * 10) / 10;

        // Determine BMI category
        let category: string;
        if (bmi < 18.5) {
          category = "Underweight";
        } else if (bmi < 25) {
          category = "Normal weight";
        } else if (bmi < 30) {
          category = "Overweight";
        } else {
          category = "Obese";
        }

        const result = `BMI Calculation Result:
- Weight: ${weight} ${unit === "imperial" ? "lbs" : "kg"}
- Height: ${height} ${unit === "imperial" ? "ft" : "m"}
- BMI: ${bmiRounded}
- Category: ${category}

BMI Categories:
- Underweight: < 18.5
- Normal weight: 18.5 - 24.9
- Overweight: 25 - 29.9
- Obese: ≥ 30`;

        console.log("🔧 calculateBMI tool result:", result);
        return result;
      } catch (error) {
        const errorResult = `Error calculating BMI: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.log("🔧 calculateBMI tool error:", errorResult);
        return errorResult;
      }
    },
  },

  /** Get current weather information for a location */
  getWeather: {
    description:
      "Get current weather information for a specified location. Returns temperature, weather conditions, humidity, and wind speed. This tool demonstrates API integration and provides real-world utility.",
    parameters: z.object({
      location: z
        .string()
        .describe(
          "The city name or location to get weather for (e.g., 'New York', 'London, UK', 'Tokyo, Japan')"
        ),
      units: z
        .enum(["metric", "imperial", "standard"])
        .optional()
        .default("metric")
        .describe(
          "Temperature units: 'metric' (Celsius), 'imperial' (Fahrenheit), or 'standard' (Kelvin)"
        ),
    }),
    execute: async ({
      location,
      units = "metric",
    }: {
      location: string;
      units?: "metric" | "imperial" | "standard";
    }) => {
      console.log("🔧 getWeather tool called with:", { location, units });

      try {
        // Note: In a real implementation, you'd use an actual weather API like OpenWeatherMap
        // For demonstration purposes, we'll simulate weather data

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Generate realistic mock weather data
        const temperatures = {
          metric: Math.round(Math.random() * 30 + 5), // 5-35°C
          imperial: Math.round(Math.random() * 54 + 41), // 41-95°F
          standard: Math.round(Math.random() * 30 + 278), // 278-308K
        };

        const conditions = [
          "Clear sky",
          "Few clouds",
          "Scattered clouds",
          "Broken clouds",
          "Light rain",
          "Moderate rain",
          "Thunderstorm",
          "Snow",
          "Mist",
          "Partly cloudy",
          "Overcast",
          "Drizzle",
        ];

        const condition =
          conditions[Math.floor(Math.random() * conditions.length)];
        const humidity = Math.round(Math.random() * 40 + 40); // 40-80%
        const windSpeed = Math.round(Math.random() * 15 + 2); // 2-17 km/h or mph
        const temperature = temperatures[units];

        // Determine temperature unit symbol
        const tempUnit =
          units === "metric" ? "°C" : units === "imperial" ? "°F" : "K";
        const speedUnit = units === "imperial" ? "mph" : "km/h";

        // Generate weather emoji based on condition
        const getWeatherEmoji = (condition: string) => {
          if (condition.includes("Clear")) return "☀️";
          if (condition.includes("cloud")) return "☁️";
          if (condition.includes("rain") || condition.includes("Drizzle"))
            return "🌧️";
          if (condition.includes("Thunder")) return "⛈️";
          if (condition.includes("Snow")) return "❄️";
          if (condition.includes("Mist")) return "🌫️";
          return "🌤️";
        };

        const emoji = getWeatherEmoji(condition);

        const result = `${emoji} Weather for ${location}:

🌡️ Temperature: ${temperature}${tempUnit}
🌤️ Conditions: ${condition}
💧 Humidity: ${humidity}%
💨 Wind Speed: ${windSpeed} ${speedUnit}

📍 Location: ${location}
⏰ Data retrieved: ${new Date().toLocaleString()}

Note: This is simulated weather data for demonstration purposes.
In a production environment, this would connect to a real weather API.`;

        console.log("🔧 getWeather tool result:", result);
        return result;
      } catch (error) {
        const errorResult = `Error getting weather data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.log("🔧 getWeather tool error:", errorResult);
        return errorResult;
      }
    },
  },

  /** Web search tool using SerpApi to search across multiple search engines */
  searchWeb: {
    description:
      "Search the web across various search engines (Google, Bing, Yahoo, etc.) using SerpApi. This tool can perform web searches, find specific information, get search results, news, images, shopping results, and more. Useful for finding current information, research, competitive analysis, and content discovery.",
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
        .describe(
          "Time filter for recent results (only for supported engines)"
        ),
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
  },
};
