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
      // Create a temporary div to render the markdown as HTML
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.opacity = "0";
      tempDiv.style.pointerEvents = "none";

      // Find a rendered markdown element to copy its HTML structure
      // We'll look for the prose element that contains the rendered markdown
      const messageElements = document.querySelectorAll(".prose");
      let htmlContent = "";

      // Try to find the matching message content in the DOM
      for (const element of messageElements) {
        const elementText = element.textContent || "";
        // Simple heuristic: if the element contains a significant portion of our text
        if (
          elementText.includes(text.substring(0, Math.min(100, text.length)))
        ) {
          htmlContent = element.innerHTML;
          break;
        }
      }

      // Fallback: convert markdown-like formatting to HTML manually
      if (!htmlContent) {
        htmlContent = text
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>")
          .replace(/`(.*?)`/g, "<code>$1</code>")
          .replace(/\n\n/g, "</p><p>")
          .replace(/\n/g, "<br>");
        htmlContent = `<p>${htmlContent}</p>`;
      }

      // Create clipboard items with both HTML and plain text
      const clipboardItems = new ClipboardItem({
        "text/html": new Blob([htmlContent], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      });

      await navigator.clipboard.write([clipboardItems]);
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
    // Find the parent message container first
    const messageContainers = document.querySelectorAll('[class*="prose"]');
    const targetElements: Element[] = [];

    // Find all text elements within the message that are NOT reasoning parts
    for (const container of messageContainers) {
      const containerText = container.textContent || "";

      // Check if this container contains our message text
      if (
        containerText.includes(
          messageText.substring(0, Math.min(50, messageText.length))
        )
      ) {
        // Find only the text elements that are not reasoning/thinking parts
        const textElements = container.querySelectorAll("*");

        for (const element of textElements) {
          const parent = element.parentElement;

          // Skip elements that are inside reasoning containers
          // Check for reasoning indicators in classes or content
          if (
            parent &&
            (parent.className.includes("amber") || // reasoning sections use amber colors
              parent.className.includes("thinking") ||
              element.textContent?.includes("💭") ||
              element.closest('[class*="amber"]')) // check if any ancestor has amber styling
          ) {
            continue;
          }

          // Only include elements with actual text content that matches our message
          const elemText = element.textContent || "";
          if (
            elemText.trim() &&
            messageText.includes(elemText.trim().substring(0, 20))
          ) {
            targetElements.push(element);
          }
        }
        break;
      }
    }

    // If we found specific text elements, copy them
    if (
      targetElements.length > 0 &&
      navigator.clipboard &&
      window.ClipboardItem
    ) {
      let combinedHtml = "";
      let combinedText = "";

      // Combine the content from non-reasoning elements
      for (const element of targetElements) {
        if (
          element.tagName === "P" ||
          element.tagName === "DIV" ||
          element.className.includes("prose")
        ) {
          combinedHtml += element.innerHTML + "\n";
          combinedText += (element.textContent || "") + "\n";
        }
      }

      if (combinedHtml || combinedText) {
        const clipboardItems = new ClipboardItem({
          "text/html": new Blob([combinedHtml], { type: "text/html" }),
          "text/plain": new Blob([combinedText.trim()], { type: "text/plain" }),
        });

        await navigator.clipboard.write([clipboardItems]);
        return true;
      }
    }

    // Fallback: try to find main prose containers excluding reasoning
    const proseElements = document.querySelectorAll(".prose");
    for (const prose of proseElements) {
      // Skip if this prose element is inside a reasoning container
      if (
        prose.closest('[class*="amber"]') ||
        prose.closest('[class*="thinking"]')
      ) {
        continue;
      }

      const proseText = prose.textContent || "";
      if (
        proseText.includes(
          messageText.substring(0, Math.min(100, messageText.length))
        )
      ) {
        if (navigator.clipboard && window.ClipboardItem) {
          const clipboardItems = new ClipboardItem({
            "text/html": new Blob([prose.innerHTML], { type: "text/html" }),
            "text/plain": new Blob([proseText.trim()], { type: "text/plain" }),
          });

          await navigator.clipboard.write([clipboardItems]);
          return true;
        }
      }
    }

    // Final fallback to regular copy
    return await copyFormattedTextToClipboard(messageText);
  } catch (error) {
    console.error("Failed to copy message from DOM:", error);
    // Fallback to regular copy
    return await copyFormattedTextToClipboard(messageText);
  }
}
