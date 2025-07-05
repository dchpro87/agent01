import { createDefaultTextSplitter, TextChunk } from "@/utils/text-chunker";
import pdfParse from "pdf-parse";

export interface ProcessedPDFResult {
  chunks: TextChunk[];
  metadata: {
    filename: string;
    totalPages?: number;
    totalChunks: number;
    originalSize: number;
    processedAt: string;
  };
}

export class PDFProcessor {
  private textSplitter = createDefaultTextSplitter();

  async processPDFFile(file: File): Promise<ProcessedPDFResult> {
    try {
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Parse PDF
      const pdfData = await pdfParse(buffer);

      // Clean and normalize text
      const cleanedText = this.cleanText(pdfData.text);

      // Split into chunks
      const chunks = this.textSplitter.splitText(cleanedText);

      return {
        chunks,
        metadata: {
          filename: file.name,
          totalPages: pdfData.numpages,
          totalChunks: chunks.length,
          originalSize: file.size,
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to process PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private cleanText(text: string): string {
    return (
      text
        // Remove excessive whitespace
        .replace(/\s+/g, " ")
        // Remove page breaks and form feeds
        .replace(/[\f\r]/g, "")
        // Normalize line breaks
        .replace(/\n\s*\n/g, "\n\n")
        // Remove leading/trailing whitespace
        .trim()
    );
  }

  /**
   * Generate document IDs for chunks
   */
  generateChunkIds(filename: string, chunks: TextChunk[]): string[] {
    const baseId = filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9]/g, "_");
    return chunks.map((_, index) => `${baseId}_chunk_${index + 1}`);
  }

  /**
   * Generate metadata for each chunk
   */
  generateChunkMetadata(
    filename: string,
    chunks: TextChunk[],
    globalMetadata: Record<string, unknown> = {}
  ): Record<string, unknown>[] {
    return chunks.map((chunk, index) => ({
      ...globalMetadata,
      source_file: filename,
      chunk_index: index + 1,
      total_chunks: chunks.length,
      chunk_start: chunk.start,
      chunk_end: chunk.end,
      chunk_length: chunk.content.length,
    }));
  }
}

export const pdfProcessor = new PDFProcessor();
