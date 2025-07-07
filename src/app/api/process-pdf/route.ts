import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";
import { createOllamaEmbeddingFunction } from "@/lib/ollama-embedding";
import { parsePDF, cleanText } from "@/lib/pdf-utils";
import {
  CHROMADB_BASE_URL,
  DEFAULT_TEXT_SPLITTER_CONFIG,
} from "@/constants/pdf-constants";
import { ChunkingOptions, TextChunk } from "@/types/pdf";

let client: ChromaClient | null = null;

async function getClient(): Promise<ChromaClient> {
  if (!client) {
    client = new ChromaClient({
      path: CHROMADB_BASE_URL,
    });
  }
  return client;
}

class RecursiveTextSplitter {
  private chunkSize: number;
  private overlap: number;
  private separators: string[];

  constructor(options: ChunkingOptions) {
    this.chunkSize = options.chunkSize;
    this.overlap = options.overlap;
    this.separators = options.separators || ["\n\n", "\n", " ", ""];
  }

  splitText(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    const finalChunks = this.recursiveSplit(text, this.separators);

    let currentStart = 0;
    finalChunks.forEach((chunk, index) => {
      const start = text.indexOf(chunk, currentStart);
      const end = start + chunk.length;

      chunks.push({
        content: chunk,
        index,
        start,
        end,
      });

      currentStart = start + 1;
    });

    return chunks;
  }

  private recursiveSplit(text: string, separators: string[]): string[] {
    const [separator, ...remainingSeparators] = separators;

    if (!separator) {
      return this.splitByLength(text);
    }

    const splits = text.split(separator);
    const goodSplits: string[] = [];

    for (const split of splits) {
      if (split.length <= this.chunkSize) {
        goodSplits.push(split);
      } else {
        const subSplits = this.recursiveSplit(split, remainingSeparators);
        goodSplits.push(...subSplits);
      }
    }

    return this.mergeChunks(goodSplits, separator);
  }

  private splitByLength(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + this.chunkSize;

      if (end < text.length) {
        const searchStart = Math.max(start, end - 100);
        const searchEnd = Math.min(text.length, end + 100);
        const substr = text.substring(searchStart, searchEnd);
        const lastSpace = substr.lastIndexOf(" ");

        if (lastSpace !== -1) {
          end = searchStart + lastSpace;
        }
      }

      chunks.push(text.substring(start, end));
      start = end - this.overlap;
    }

    return chunks.filter((chunk) => chunk.trim().length > 0);
  }

  private mergeChunks(chunks: string[], separator: string): string[] {
    if (chunks.length === 0) return [];

    const merged: string[] = [];
    let currentChunk = chunks[0];

    for (let i = 1; i < chunks.length; i++) {
      const nextChunk = chunks[i];
      const combined = currentChunk + separator + nextChunk;

      if (combined.length <= this.chunkSize) {
        currentChunk = combined;
      } else {
        merged.push(currentChunk);
        currentChunk = nextChunk;
      }
    }

    merged.push(currentChunk);
    return this.applyOverlap(merged);
  }

  private applyOverlap(chunks: string[]): string[] {
    if (chunks.length <= 1 || this.overlap === 0) return chunks;

    const result: string[] = [chunks[0]];

    for (let i = 1; i < chunks.length; i++) {
      const prevChunk = chunks[i - 1];
      const currentChunk = chunks[i];

      const overlapText = prevChunk.slice(-this.overlap);

      if (!currentChunk.startsWith(overlapText)) {
        result.push(overlapText + currentChunk);
      } else {
        result.push(currentChunk);
      }
    }

    return result;
  }
}

const createDefaultTextSplitter = () => {
  return new RecursiveTextSplitter(DEFAULT_TEXT_SPLITTER_CONFIG);
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let parseStartTime: number;
  let chunkingStartTime: number;
  let embeddingStartTime: number;
  let storageStartTime: number;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const collectionName = formData.get("collectionName") as string;
    const useOllamaEmbedding = formData.get("useOllamaEmbedding") === "true";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!collectionName) {
      return NextResponse.json(
        { success: false, error: "Collection name is required" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    console.log(
      `🔄 Starting PDF processing for: ${file.name} (${(
        file.size /
        1024 /
        1024
      ).toFixed(2)}MB)`
    );

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF using utility function
    parseStartTime = Date.now();
    let pdfData;
    try {
      console.log(`📖 Parsing PDF content...`);
      pdfData = await parsePDF(buffer);
      console.log(
        `✅ PDF parsed: ${pdfData.numpages} pages, ${pdfData.text.length} characters`
      );
    } catch (pdfError) {
      console.error("Error parsing PDF:", pdfError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse PDF file. Please ensure it's a valid PDF.",
        },
        { status: 400 }
      );
    }
    const parseTime = Date.now() - parseStartTime;

    // Clean and normalize text
    const cleanedText = cleanText(pdfData.text);
    console.log(
      `🧹 Text cleaned: ${cleanedText.length} characters after normalization`
    );

    // Split into chunks
    chunkingStartTime = Date.now();
    console.log(`✂️ Chunking text...`);
    const textSplitter = createDefaultTextSplitter();
    const chunks = textSplitter.splitText(cleanedText);
    const chunkingTime = Date.now() - chunkingStartTime;
    console.log(`✅ Created ${chunks.length} chunks in ${chunkingTime}ms`);

    // Generate document IDs and metadata
    const baseId = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9]/g, "_");
    const chunkIds = chunks.map((_, index) => `${baseId}_chunk_${index + 1}`);

    const chunkMetadata = chunks.map((chunk, index) => ({
      source_file: file.name,
      chunk_index: index + 1,
      total_chunks: chunks.length,
      chunk_start: chunk.start,
      chunk_end: chunk.end,
      chunk_length: chunk.content.length,
      upload_timestamp: new Date().toISOString(),
      file_size: file.size,
      total_pages: pdfData.numpages,
      parse_time_ms: parseTime,
      chunking_time_ms: chunkingTime,
    }));

    // Extract chunk content
    const documents = chunks.map((chunk) => chunk.content);

    // Add documents directly to ChromaDB
    try {
      const chromaClient = await getClient();
      const collection = await chromaClient.getCollection({
        name: collectionName,
      });

      // Generate embeddings if requested
      let embeddings: number[][] | undefined;
      let embeddingTime = 0;

      if (useOllamaEmbedding) {
        embeddingStartTime = Date.now();
        console.log(
          `🔮 Generating embeddings for ${documents.length} documents using Ollama nomic-embed-text`
        );

        // Create embedding function with optimized settings for large documents
        const embeddingFunction = createOllamaEmbeddingFunction(
          "nomic-embed-text",
          {
            timeout: 180000, // 3 minutes for large documents
            batchSize: 2, // Very small batches for large PDF processing
            maxConcurrent: 1, // Sequential processing to avoid overwhelming the server
            retryAttempts: 5, // More retries for reliability
            retryDelay: 3000, // Longer delay between retries
          }
        );

        embeddings = await embeddingFunction.generate(documents);
        embeddingTime = Date.now() - embeddingStartTime;

        console.log(
          `✅ Generated ${embeddings.length} embeddings with ${
            embeddings[0]?.length
          } dimensions each in ${Math.round(embeddingTime / 1000)}s`
        );
      } else {
        console.log(`⏭️ Skipping embedding generation as requested`);
      }

      // Store in ChromaDB
      storageStartTime = Date.now();
      console.log(
        `💾 Storing documents in ChromaDB collection: ${collectionName}`
      );

      await collection.add({
        ids: chunkIds,
        documents,
        metadatas: chunkMetadata,
        embeddings,
      });

      const storageTime = Date.now() - storageStartTime;
      const totalTime = Date.now() - startTime;

      console.log(
        `✅ Successfully stored ${chunks.length} chunks in ${storageTime}ms`
      );
      console.log(`🎉 Total processing time: ${totalTime}ms`);

      // Calculate performance metrics
      const avgChunkSize =
        chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) /
        chunks.length;
      const processingRate = chunks.length / (totalTime / 1000);

      return NextResponse.json({
        success: true,
        message: `Successfully processed and added ${chunks.length} document chunks to collection "${collectionName}"`,
        data: {
          totalChunks: chunks.length,
          totalPages: pdfData.numpages,
          filename: file.name,
          collectionName,
          embeddingsGenerated: useOllamaEmbedding,
          embeddingDimensions: embeddings?.[0]?.length,
          processingMetrics: {
            totalTime,
            parseTime,
            chunkingTime,
            embeddingTime,
            storageTime,
            avgChunkSize: Math.round(avgChunkSize),
            processingRate: Math.round(processingRate * 100) / 100,
            textLength: cleanedText.length,
            originalTextLength: pdfData.text.length,
          },
        },
      });
    } catch (chromaError) {
      console.error("Error adding documents to ChromaDB:", chromaError);
      return NextResponse.json(
        {
          success: false,
          error:
            chromaError instanceof Error
              ? chromaError.message
              : "Failed to add documents to collection",
          processingMetrics: {
            totalTime: Date.now() - startTime,
            parseTime: parseTime || 0,
            chunkingTime: chunkingTime || 0,
            embeddingTime: 0,
            storageTime: 0,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process PDF",
        processingMetrics: {
          totalTime: Date.now() - startTime,
          parseTime: 0,
          chunkingTime: 0,
          embeddingTime: 0,
          storageTime: 0,
        },
      },
      { status: 500 }
    );
  }
}
