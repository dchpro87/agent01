import type { Message } from '@ai-sdk/react';

// Message parts type matching the components
interface MessagePartType {
  type:
    | 'text'
    | 'text-delta'
    | 'tool-invocation'
    | 'tool-call'
    | 'tool-result'
    | 'step-start'
    | 'reasoning'
    | 'source'
    | 'file';
  text?: string;
  textDelta?: string;
  toolInvocation?: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: 'partial-call' | 'call' | 'result';
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
  if (message.role === 'user') {
    // For user messages, return the content directly
    return message.content || '';
  }

  // For assistant messages, we need to extract only the main text parts
  if (message.parts && message.parts.length > 0) {
    // Process message parts and extract only text/text-delta parts
    const textParts: string[] = [];

    (message.parts as MessagePartType[]).forEach((part) => {
      switch (part.type) {
        case 'text':
        case 'text-delta':
          // Only include main text content, not reasoning
          const textContent = part.text || part.textDelta || '';
          if (textContent.trim()) {
            // Additional filtering to exclude thinking/reasoning patterns
            const cleanedText = textContent.trim();

            // Skip text that looks like reasoning patterns
            if (
              cleanedText.startsWith('💭') ||
              cleanedText.includes('thinking...') ||
              cleanedText.includes('reasoning:') ||
              cleanedText.toLowerCase().includes('let me think') ||
              cleanedText.toLowerCase().includes('i need to') ||
              (cleanedText.startsWith('<') &&
                cleanedText.includes('thinking')) ||
              (cleanedText.startsWith('[') && cleanedText.includes('reasoning'))
            ) {
              return; // Skip this part
            }

            textParts.push(cleanedText);
          }
          break;
        // Skip reasoning, tool-invocations, tool-calls, tool-results, etc.
        case 'reasoning':
        case 'tool-invocation':
        case 'tool-call':
        case 'tool-result':
        case 'source':
        case 'file':
        case 'step-start':
        default:
          // Intentionally skip these parts
          break;
      }
    });

    return textParts.join('\n\n').trim();
  }

  // Fallback to legacy content if no parts, but also filter reasoning from legacy content
  const content = message.content || '';

  // If using legacy content, try to filter out obvious reasoning sections
  const lines = content.split('\n');
  const filteredLines = lines.filter((line) => {
    const trimmedLine = line.trim();
    return !(
      trimmedLine.startsWith('💭') ||
      trimmedLine.includes('thinking...') ||
      trimmedLine.includes('reasoning:') ||
      trimmedLine.toLowerCase().includes('let me think') ||
      (trimmedLine.startsWith('<') && trimmedLine.includes('thinking')) ||
      (trimmedLine.startsWith('[') && trimmedLine.includes('reasoning'))
    );
  });

  return filteredLines.join('\n').trim();
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
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        // Bold
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Unordered lists
        .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>')
        // Headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>');

      // Wrap list items in ul tags
      htmlContent = htmlContent.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

      // Convert double newlines to paragraph breaks
      const paragraphs = htmlContent.split(/\n\n+/);
      htmlContent = paragraphs
        .map((para) => {
          para = para.trim();
          // Don't wrap if already wrapped in a block element
          if (
            para.startsWith('<h') ||
            para.startsWith('<pre') ||
            para.startsWith('<ul') ||
            para.startsWith('<ol') ||
            para.startsWith('<blockquote')
          ) {
            return para;
          }
          // Convert single newlines within paragraphs to <br>
          para = para.replace(/\n/g, '<br>');
          return para ? `<p>${para}</p>` : '';
        })
        .filter((p) => p)
        .join('');

      // Create clipboard items with both HTML and plain text
      const clipboardItems = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      });

      await navigator.clipboard.write([clipboardItems]);
      console.log('✅ Copied with basic markdown-to-HTML conversion');
      return true;
    }

    // Fallback to plain text if ClipboardItem is not supported
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    return successful;
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error);
    return false;
  }
}

/**
 * Enhanced copy function that uses the Selection API to copy text exactly as if
 * the user selected it with the mouse. This preserves all formatting.
 */
export async function copyMessageFromDOM(
  messageText: string,
  buttonElement?: HTMLElement
): Promise<boolean> {
  try {
    let proseElement: Element | null = null;

    // If we have the button element, traverse up to find the message container
    if (buttonElement) {
      // Find the parent message bubble (the div with rounded-2xl class)
      const messageContainer = buttonElement.closest('.rounded-2xl');

      if (messageContainer) {
        // Find all prose elements inside this specific container
        const proseElements = messageContainer.querySelectorAll('.prose');

        // Find the main content prose element (not inside tool/reasoning boxes)
        for (const prose of proseElements) {
          // Skip prose elements that are inside tool invocation or reasoning boxes
          if (
            prose.closest('[class*="border-blue"]') ||
            prose.closest('[class*="border-amber"]') ||
            prose.closest('[class*="bg-blue"]') ||
            prose.closest('[class*="bg-amber"]')
          ) {
            continue;
          }

          // This should be the main message prose element
          proseElement = prose;
          break;
        }
      }
    }

    // If we found the prose element, use the Selection API to copy it
    if (proseElement) {
      // Create a range that selects the entire prose element content
      const range = document.createRange();
      range.selectNodeContents(proseElement);

      // Get the current selection and clear it
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);

        // Use the browser's native copy command
        const successful = document.execCommand('copy');

        // Clear the selection so it doesn't show visually
        selection.removeAllRanges();

        if (successful) {
          console.log('✅ Copied text using Selection API');
          return true;
        }
      }
    }

    // Fallback: try to find by searching all rounded message bubbles
    if (!proseElement) {
      const messageContainers = document.querySelectorAll('.rounded-2xl');

      for (const container of messageContainers) {
        const containerText = container.textContent || '';

        // Check if this container has our message text
        const matchLength = Math.min(150, messageText.length);
        const messageSubstring = messageText.substring(0, matchLength).trim();

        if (containerText.trim().includes(messageSubstring)) {
          // Found the matching container
          // Now find the prose element inside it (excluding tool invocation boxes)
          const proseElements = container.querySelectorAll('.prose');

          for (const prose of proseElements) {
            // Skip prose elements that are inside tool invocation or reasoning boxes
            if (
              prose.closest('[class*="border-blue"]') ||
              prose.closest('[class*="border-amber"]') ||
              prose.closest('[class*="bg-blue"]') ||
              prose.closest('[class*="bg-amber"]')
            ) {
              continue;
            }

            const proseText = prose.textContent || '';
            if (proseText.trim().includes(messageSubstring)) {
              // Found the correct prose element, use Selection API
              const range = document.createRange();
              range.selectNodeContents(prose);

              const selection = window.getSelection();
              if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);

                const successful = document.execCommand('copy');
                selection.removeAllRanges();

                if (successful) {
                  console.log('✅ Copied text using Selection API (fallback)');
                  return true;
                }
              }
            }
          }
        }
      }
    }

    // If we didn't find a matching prose element, fall back to converting markdown
    console.log('⚠️ Could not find matching prose element, using fallback');
    return await copyFormattedTextToClipboard(messageText);
  } catch (error) {
    console.error('Failed to copy message from DOM:', error);
    // Fallback to regular copy
    return await copyFormattedTextToClipboard(messageText);
  }
}
