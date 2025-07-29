/**
 * Clear PDF Attachments API Route
 *
 * This endpoint clears PDF attachments from the global store when a chat is reset.
 * It supports clearing all PDFs or PDFs associated with a specific chat ID.
 */

import { pdfAttachmentStore } from "@/lib/pdf-attachment-store";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId, clearAll } = body;

    if (clearAll) {
      // Clear all PDF attachments
      pdfAttachmentStore.clearAllPDFAttachments();

      return new Response(
        JSON.stringify({
          success: true,
          message: "All PDF attachments cleared successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else if (chatId) {
      // Remove PDFs associated with the specific chat ID
      const removedCount =
        pdfAttachmentStore.removePDFAttachmentsByChatId(chatId);

      return new Response(
        JSON.stringify({
          success: true,
          message: `${removedCount} PDF attachment(s) for chat ${chatId} cleared successfully`,
          removedCount: removedCount,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          error:
            "Invalid request: either 'clearAll' or 'chatId' must be provided",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error clearing PDF attachments:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to clear PDF attachments",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET() {
  // Return current PDF attachment statistics
  try {
    const stats = pdfAttachmentStore.getStats();
    const attachments = pdfAttachmentStore.getAllPDFAttachments();

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        attachments: attachments.map((att) => ({
          id: att.id,
          name: att.name,
          size: att.size,
          uploadedAt: att.uploadedAt,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error getting PDF attachment stats:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to get PDF attachment statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
