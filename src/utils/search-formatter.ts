import type {
  SearchResult,
  NewsResult,
  ShoppingResult,
  ImageResult,
  VideoResult,
  SerpApiResponse,
} from "@/types";

/**
 * Helper function to format search results based on engine type
 * @param response - The SerpAPI response object
 * @param engine - The search engine used
 * @returns Formatted string with search results
 */
export function formatSearchResults(
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
