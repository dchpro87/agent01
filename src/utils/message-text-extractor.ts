import type { Message } from "@ai-sdk/react";

// Message parts type matching the components
interface MessagePartType {
  type:
    | "text"
    | "text-delta"
    | "tool-invocation"
    | "tool-call"
    | "tool-result"
    | "step-start"
    | "reasoning"
    | "source"
    | "file";
  text?: string;
  textDelta?: string;
  toolInvocation?: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: "partial-call" | "call" | "result";
    result?: unknown;
  };
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  reasoning?: string;
  source?: unknown;
  base64?: string;
  uint8Array?: Uint8Array;
  mimeType?: string;
}

/**
 * Extracts the main text content from a message, excluding reasoning/thinking parts
 * and tool invocations. This preserves the formatted text that would be rendered
 * in the UI for copying purposes.
 */
export function extractMainTextContent(message: Message): string {
  if (message.role === "user") {
    // For user messages, return the content directly
    return message.content || "";
  }

  // For assistant messages, we need to extract only the main text parts
  if (message.parts && message.parts.length > 0) {
    // Process message parts and extract only text/text-delta parts
    const textParts: string[] = [];

    (message.parts as MessagePartType[]).forEach((part) => {
      switch (part.type) {
        case "text":
        case "text-delta":
          // Only include main text content, not reasoning
          const textContent = part.text || part.textDelta || "";
          if (textContent.trim()) {
            // Additional filtering to exclude thinking/reasoning patterns
            const cleanedText = textContent.trim();

            // Skip text that looks like reasoning patterns
            if (
              cleanedText.startsWith("💭") ||
              cleanedText.includes("thinking...") ||
              cleanedText.includes("reasoning:") ||
              cleanedText.toLowerCase().includes("let me think") ||
              cleanedText.toLowerCase().includes("i need to") ||
              (cleanedText.startsWith("<") &&
                cleanedText.includes("thinking")) ||
              (cleanedText.startsWith("[") && cleanedText.includes("reasoning"))
            ) {
              return; // Skip this part
            }

            textParts.push(cleanedText);
          }
          break;
        // Skip reasoning, tool-invocations, tool-calls, tool-results, etc.
        case "reasoning":
        case "tool-invocation":
        case "tool-call":
        case "tool-result":
        case "source":
        case "file":
        case "step-start":
        default:
          // Intentionally skip these parts
          break;
      }
    });

    return textParts.join("\n\n").trim();
  }

  // Fallback to legacy content if no parts, but also filter reasoning from legacy content
  const content = message.content || "";

  // If using legacy content, try to filter out obvious reasoning sections
  const lines = content.split("\n");
  const filteredLines = lines.filter((line) => {
    const trimmedLine = line.trim();
    return !(
      trimmedLine.startsWith("💭") ||
      trimmedLine.includes("thinking...") ||
      trimmedLine.includes("reasoning:") ||
      trimmedLine.toLowerCase().includes("let me think") ||
      (trimmedLine.startsWith("<") && trimmedLine.includes("thinking")) ||
      (trimmedLine.startsWith("[") && trimmedLine.includes("reasoning"))
    );
  });

  return filteredLines.join("\n").trim();
}

/**
 * Copies text to clipboard preserving formatting (HTML)
 * This function copies both plain text and HTML versions to clipboard
 * so that when pasting into rich text editors, formatting is preserved
 */
export async function copyFormattedTextToClipboard(
  text: string
): Promise<boolean> {
  try {
    // Use the modern Clipboard API if available
    if (navigator.clipboard && window.ClipboardItem) {
      // Convert markdown-like formatting to HTML
      // This is a basic conversion for common markdown patterns
      let htmlContent = text
        // Code blocks (triple backticks)
        .replace(/```(\w+)?\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
        // Bold
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        // Italic
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        // Inline code
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Unordered lists
        .replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>")
        // Headers
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/^# (.+)$/gm, "<h1>$1</h1>");

      // Wrap list items in ul tags
      htmlContent = htmlContent.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

      // Convert double newlines to paragraph breaks
      const paragraphs = htmlContent.split(/\n\n+/);
      htmlContent = paragraphs
        .map((para) => {
          para = para.trim();
          // Don't wrap if already wrapped in a block element
          if (
            para.startsWith("<h") ||
            para.startsWith("<pre") ||
            para.startsWith("<ul") ||
            para.startsWith("<ol") ||
            para.startsWith("<blockquote")
          ) {
            return para;
          }
          // Convert single newlines within paragraphs to <br>
          para = para.replace(/\n/g, "<br>");
          return para ? `<p>${para}</p>` : "";
        })
        .filter((p) => p)
        .join("");

      // Create clipboard items with both HTML and plain text
      const clipboardItems = new ClipboardItem({
        "text/html": new Blob([htmlContent], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      });

      await navigator.clipboard.write([clipboardItems]);
      console.log("✅ Copied with basic markdown-to-HTML conversion");
      return true;
    }

    // Fallback to plain text if ClipboardItem is not supported
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    return successful;
  } catch (error) {
    console.error("Failed to copy text to clipboard:", error);
    return false;
  }
}

/**
 * Enhanced copy function that tries to preserve formatting by copying from DOM
 * This function attempts to copy the actual rendered content from the DOM element
 * to preserve the exact formatting that the user sees, while excluding reasoning parts
 */
export async function copyMessageFromDOM(
  messageText: string
): Promise<boolean> {
  try {
    // Find prose containers (where markdown is rendered)
    const proseElements = document.querySelectorAll(".prose");

    for (const prose of proseElements) {
      // Skip if this prose element is inside a reasoning/thinking container
      if (
        prose.closest('[class*="amber"]') ||
        prose.closest('[class*="thinking"]')
      ) {
        continue;
      }

      const proseText = prose.textContent || "";

      // Check if this prose element contains our message text
      // Use a more robust matching approach with a reasonable substring
      const matchLength = Math.min(150, messageText.length);
      const messageSubstring = messageText.substring(0, matchLength).trim();

      if (proseText.trim().includes(messageSubstring)) {
        // Found the matching prose element with rendered HTML
        if (navigator.clipboard && window.ClipboardItem) {
          // Get the innerHTML which contains the rendered markdown as HTML
          const htmlContent = prose.innerHTML;
          const plainText = proseText.trim();

          // Create clipboard items with both HTML (for rich text editors) and plain text
          const clipboardItems = new ClipboardItem({
            "text/html": new Blob([htmlContent], { type: "text/html" }),
            "text/plain": new Blob([plainText], { type: "text/plain" }),
          });

          await navigator.clipboard.write([clipboardItems]);
          console.log("✅ Copied formatted text from DOM");
          return true;
        }
      }
    }

    // If we didn't find a matching prose element, fall back to converting markdown
    console.log("⚠️ Could not find matching prose element, using fallback");
    return await copyFormattedTextToClipboard(messageText);
  } catch (error) {
    console.error("Failed to copy message from DOM:", error);
    // Fallback to regular copy
    return await copyFormattedTextToClipboard(messageText);
  }
}
