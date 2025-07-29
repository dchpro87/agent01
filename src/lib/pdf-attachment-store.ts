/**
 * Global PDF Attachment Store
 *
 * This module provides a global storage mechanism for PDF attachments
 * that can be accessed by tools like document-summarizer.
 */

export interface PDFAttachment {
  id: string;
  name: string;
  contentType: string;
  url: string;
  data: ArrayBuffer;
  uploadedAt: Date;
  size: number;
  chatId?: string; // Optional chat ID to associate PDFs with specific chats
}

class PDFAttachmentStore {
  private attachments: Map<string, PDFAttachment> = new Map();

  /**
   * Store a PDF attachment globally (with duplicate detection)
   */
  async storePDFAttachment(
    attachment: {
      name: string;
      contentType: string;
      url: string;
    },
    chatId?: string
  ): Promise<string> {
    try {
      // Download the PDF data from the data URL
      let arrayBuffer: ArrayBuffer;
      if (attachment.url.startsWith("data:")) {
        // Handle data URLs
        const response = await fetch(attachment.url);
        arrayBuffer = await response.arrayBuffer();
      } else {
        // Handle regular URLs
        const response = await fetch(attachment.url);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch PDF: ${response.status} ${response.statusText}`
          );
        }
        arrayBuffer = await response.arrayBuffer();
      }

      // Check for duplicates based on name and size
      const existingPDF = this.findDuplicatePDF(
        attachment.name,
        arrayBuffer.byteLength
      );
      if (existingPDF) {
        console.log(
          `📄 Found existing PDF: ${attachment.name} (ID: ${existingPDF.id}, Size: ${existingPDF.size} bytes) - skipping duplicate`
        );
        return existingPDF.id;
      }

      // Generate unique ID for this attachment
      const id = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const pdfAttachment: PDFAttachment = {
        id,
        name: attachment.name,
        contentType: attachment.contentType,
        url: attachment.url,
        data: arrayBuffer,
        uploadedAt: new Date(),
        size: arrayBuffer.byteLength,
        chatId: chatId, // Associate with chat ID if provided
      };

      this.attachments.set(id, pdfAttachment);

      console.log(
        `📄 Stored new PDF attachment: ${attachment.name} (ID: ${id}, Size: ${
          arrayBuffer.byteLength
        } bytes, Chat: ${chatId || "no-chat"})`
      );

      return id;
    } catch (error) {
      console.error("Failed to store PDF attachment:", error);
      throw new Error(
        `Failed to store PDF attachment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Find duplicate PDF based on name and size
   */
  private findDuplicatePDF(
    name: string,
    size: number
  ): PDFAttachment | undefined {
    for (const attachment of this.attachments.values()) {
      if (attachment.name === name && attachment.size === size) {
        return attachment;
      }
    }
    return undefined;
  }

  /**
   * Retrieve a PDF attachment by ID
   */
  getPDFAttachment(id: string): PDFAttachment | undefined {
    return this.attachments.get(id);
  }

  /**
   * Get all stored PDF attachments
   */
  getAllPDFAttachments(): PDFAttachment[] {
    return Array.from(this.attachments.values());
  }

  /**
   * Get PDF attachments by name (partial match)
   */
  getPDFAttachmentsByName(namePattern: string): PDFAttachment[] {
    const pattern = namePattern.toLowerCase();
    return Array.from(this.attachments.values()).filter((attachment) =>
      attachment.name.toLowerCase().includes(pattern)
    );
  }

  /**
   * Get PDF attachments by chat ID
   */
  getPDFAttachmentsByChatId(chatId: string): PDFAttachment[] {
    return Array.from(this.attachments.values()).filter(
      (attachment) => attachment.chatId === chatId
    );
  }

  /**
   * Remove PDF attachments by chat ID
   */
  removePDFAttachmentsByChatId(chatId: string): number {
    let removedCount = 0;
    for (const [id, attachment] of this.attachments.entries()) {
      if (attachment.chatId === chatId) {
        this.attachments.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(
        `🗑️ Removed ${removedCount} PDF attachments for chat ID: ${chatId}`
      );
    }

    return removedCount;
  }

  /**
   * Remove a PDF attachment by ID
   */
  removePDFAttachment(id: string): boolean {
    const existed = this.attachments.has(id);
    if (existed) {
      this.attachments.delete(id);
      console.log(`🗑️ Removed PDF attachment: ${id}`);
    }
    return existed;
  }

  /**
   * Clear all PDF attachments
   */
  clearAllPDFAttachments(): void {
    const count = this.attachments.size;
    this.attachments.clear();
    console.log(`🗑️ Cleared ${count} PDF attachments`);
  }

  /**
   * Clean up old attachments (older than specified hours)
   */
  cleanupOldAttachments(hoursOld = 24): number {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [id, attachment] of this.attachments.entries()) {
      if (attachment.uploadedAt < cutoffTime) {
        this.attachments.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(
        `🧹 Cleaned up ${removedCount} old PDF attachments (older than ${hoursOld} hours)`
      );
    }

    return removedCount;
  }

  /**
   * Get storage statistics
   */
  getStats() {
    const attachments = Array.from(this.attachments.values());
    const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
    const totalCount = attachments.length;

    return {
      count: totalCount,
      totalSizeBytes: totalSize,
      totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
      oldestUpload:
        attachments.length > 0
          ? Math.min(...attachments.map((a) => a.uploadedAt.getTime()))
          : null,
      newestUpload:
        attachments.length > 0
          ? Math.max(...attachments.map((a) => a.uploadedAt.getTime()))
          : null,
    };
  }
}

// Create singleton instance
const pdfAttachmentStore = new PDFAttachmentStore();

// Clean up old attachments every hour
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    pdfAttachmentStore.cleanupOldAttachments(24); // Remove attachments older than 24 hours
  }, 60 * 60 * 1000); // Run every hour
}

export { pdfAttachmentStore };
