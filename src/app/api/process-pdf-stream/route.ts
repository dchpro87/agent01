import { NextRequest } from "next/server";
import { ChromaClient } from "chromadb";
import { createOllamaEmbeddingFunction } from "@/lib/ollama-embedding";
import { parsePDF, cleanText } from "@/lib/pdf-utils";
import { DEFAULT_TEXT_SPLITTER_CONFIG } from "@/constants/pdf-constants";
import { CHROMADB_BASE_URL } from "@/constants/chromadb-constants";
import { ChunkingOptions, TextChunk } from "@/types/pdf";

let client: ChromaClient | null = null;

// Internal chunk type for the splitting process (before index is assigned)
interface InternalChunk {
  content: string;
  start: number;
  end: number;
}

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
    const chunks: InternalChunk[] = [];
    this._split(text, 0, chunks);
    return chunks.map((chunk, index) => ({ ...chunk, index }));
  }

  private _split(
    text: string,
    startIndex: number,
    chunks: InternalChunk[]
  ): void {
    if (text.length <= this.chunkSize) {
      if (text.trim()) {
        chunks.push({
          content: text.trim(),
          start: startIndex,
          end: startIndex + text.length,
        });
      }
      return;
    }

    for (const separator of this.separators) {
      if (separator === "") {
        // Last resort: character splitting
        const currentChunk = text.substring(0, this.chunkSize);
        chunks.push({
          content: currentChunk,
          start: startIndex,
          end: startIndex + currentChunk.length,
        });

        const remainingText = text.substring(this.chunkSize - this.overlap);
        if (remainingText.trim()) {
          this._split(
            remainingText,
            startIndex + this.chunkSize - this.overlap,
            chunks
          );
        }
        return;
      }

      const parts = text.split(separator);
      if (parts.length > 1) {
        let currentChunk = "";
        let currentStart = startIndex;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const potentialChunk =
            currentChunk + (currentChunk ? separator : "") + part;

          if (potentialChunk.length <= this.chunkSize || !currentChunk) {
            currentChunk = potentialChunk;
          } else {
            // Current chunk is full, save it and start new one
            if (currentChunk.trim()) {
              chunks.push({
                content: currentChunk.trim(),
                start: currentStart,
                end: currentStart + currentChunk.length,
              });
            }

            // Start new chunk with overlap
            const overlapText = currentChunk.substring(
              Math.max(0, currentChunk.length - this.overlap)
            );
            currentStart += currentChunk.length - overlapText.length;
            currentChunk = overlapText + (overlapText ? separator : "") + part;
          }
        }

        // Add the last chunk
        if (currentChunk.trim()) {
          chunks.push({
            content: currentChunk.trim(),
            start: currentStart,
            end: currentStart + currentChunk.length,
          });
        }
        return;
      }
    }
  }
}

function createDefaultTextSplitter(): RecursiveTextSplitter {
  return new RecursiveTextSplitter(DEFAULT_TEXT_SPLITTER_CONFIG);
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({
        type: "connected",
        message: "Connected to processing stream",
      })}\n\n`;
      controller.enqueue(encoder.encode(data));

      // Process PDF with real-time updates
      processWithUpdates(request, controller, encoder).catch((error) => {
        const errorData = `data: ${JSON.stringify({
          type: "error",
          error: error instanceof Error ? error.message : "Processing failed",
        })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

async function processWithUpdates(
  request: NextRequest,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const startTime = Date.now();
  let parseStartTime: number;
  let chunkingStartTime: number;
  let embeddingStartTime: number;
  let storageStartTime: number;

  const sendUpdate = (data: {
    type: string;
    step?: string;
    status?: string;
    message?: string;
    current?: number;
    total?: number;
    time?: number;
    pages?: number;
    textLength?: number;
    chunks?: number;
    dimensions?: number;
    progress?: number;
    error?: string;
    data?: {
      totalChunks: number;
      totalPages: number;
      filename: string;
      collectionName: string;
      embeddingsGenerated: boolean;
      embeddingDimensions?: number;
      processingMetrics: {
        totalTime: number;
        parseTime: number;
        chunkingTime: number;
        embeddingTime: number;
        storageTime: number;
        avgChunkSize: number;
        processingRate: number;
        textLength: number;
        originalTextLength: number;
      };
    };
  }) => {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(message));
  };

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const collectionName = formData.get("collectionName") as string;
    const useOllamaEmbedding = formData.get("useOllamaEmbedding") === "true";

    if (!file || !collectionName) {
      throw new Error("Missing required fields");
    }

    if (file.type !== "application/pdf") {
      throw new Error("Only PDF files are supported");
    }

    // Step 1: Upload complete (already done by this point)
    sendUpdate({
      type: "progress",
      step: "upload",
      status: "complete",
      message: "PDF upload completed",
      current: 1,
      total: 4,
    });

    // Step 2: Parse PDF
    sendUpdate({
      type: "progress",
      step: "parsing",
      status: "processing",
      message: "Parsing PDF content...",
      current: 2,
      total: 4,
    });

    parseStartTime = Date.now();
    console.log(`📄 Processing PDF: ${file.name} (${file.size} bytes)`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await parsePDF(buffer);
    console.log(
      `📖 Extracted ${pdfData.numpages} pages, ${pdfData.text.length} characters`
    );

    const parseTime = Date.now() - parseStartTime;

    sendUpdate({
      type: "progress",
      step: "parsing",
      status: "complete",
      message: `Extracted ${pdfData.numpages} pages`,
      time: parseTime,
      pages: pdfData.numpages,
      textLength: pdfData.text.length,
    });

    // Clean and normalize text
    const cleanedText = cleanText(pdfData.text);
    console.log(
      `🧹 Text cleaned: ${cleanedText.length} characters after normalization`
    );

    // Step 3: Chunking
    sendUpdate({
      type: "progress",
      step: "chunking",
      status: "processing",
      message: "Splitting text into chunks...",
      current: 2,
      total: 4,
    });

    chunkingStartTime = Date.now();
    console.log(`✂️ Chunking text...`);
    const textSplitter = createDefaultTextSplitter();
    const chunks = textSplitter.splitText(cleanedText);
    const chunkingTime = Date.now() - chunkingStartTime;
    console.log(`✅ Created ${chunks.length} chunks in ${chunkingTime}ms`);

    sendUpdate({
      type: "progress",
      step: "chunking",
      status: "complete",
      message: `Created ${chunks.length} chunks`,
      time: chunkingTime,
      chunks: chunks.length,
    });

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

    const documents = chunks.map((chunk) => chunk.content);

    // Get ChromaDB collection with the same embedding function that will be used for queries
    const chromaClient = await getClient();
    const embeddingFunction = useOllamaEmbedding
      ? createOllamaEmbeddingFunction()
      : undefined;

    const collection = await chromaClient.getCollection({
      name: collectionName,
      embeddingFunction: embeddingFunction,
    });

    console.log(
      `PDF Stream Processing: Using collection "${collectionName}" with ${
        useOllamaEmbedding ? "Ollama nomic-embed-text" : "default"
      } embedding function`
    );

    // Step 4: Generate embeddings (if requested)
    let embeddings: number[][] | undefined;
    let embeddingTime = 0;

    if (useOllamaEmbedding) {
      sendUpdate({
        type: "progress",
        step: "embedding",
        status: "processing",
        message: `Generating embeddings for ${documents.length} chunks...`,
        current: 3,
        total: 4,
      });

      embeddingStartTime = Date.now();
      console.log(
        `🔮 Generating embeddings for ${documents.length} documents using Ollama nomic-embed-text`
      );

      const embeddingFunction = createOllamaEmbeddingFunction(
        "nomic-embed-text",
        {
          timeout: 180000,
          batchSize: 2,
          maxConcurrent: 1,
          retryAttempts: 5,
          retryDelay: 3000,
        }
      );

      // Generate embeddings with progress updates
      const batchSize = 2;
      embeddings = [];

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const batchEmbeddings = await embeddingFunction.generate(batch);
        embeddings.push(...batchEmbeddings);

        const progress = Math.min(i + batchSize, documents.length);
        sendUpdate({
          type: "progress",
          step: "embedding",
          status: "processing",
          message: `Generated embeddings for ${progress}/${documents.length} chunks`,
          progress: Math.round((progress / documents.length) * 100),
        });
      }

      embeddingTime = Date.now() - embeddingStartTime;
      console.log(
        `✅ Generated ${embeddings.length} embeddings with ${
          embeddings[0]?.length
        } dimensions each in ${Math.round(embeddingTime / 1000)}s`
      );

      sendUpdate({
        type: "progress",
        step: "embedding",
        status: "complete",
        message: `Generated ${embeddings.length} embeddings`,
        time: embeddingTime,
        dimensions: embeddings[0]?.length,
      });
    } else {
      sendUpdate({
        type: "progress",
        step: "embedding",
        status: "complete",
        message: "Embeddings skipped",
        time: 0,
      });
      console.log(`⏭️ Skipping embedding generation as requested`);
    }

    // Step 5: Store in ChromaDB
    sendUpdate({
      type: "progress",
      step: "storage",
      status: "processing",
      message: "Storing documents in ChromaDB...",
      current: 4,
      total: 4,
    });

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

    sendUpdate({
      type: "progress",
      step: "storage",
      status: "complete",
      message: `Stored ${chunks.length} chunks`,
      time: storageTime,
    });

    // Calculate performance metrics
    const avgChunkSize =
      chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) /
      chunks.length;
    const processingRate = chunks.length / (totalTime / 1000);

    // Send final completion
    sendUpdate({
      type: "complete",
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
  } catch (error) {
    console.error("Error processing PDF:", error);
    sendUpdate({
      type: "error",
      error: error instanceof Error ? error.message : "Failed to process PDF",
    });
  } finally {
    controller.close();
  }
}
