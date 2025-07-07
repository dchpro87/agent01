// Custom ChromaDB embedding function that uses Ollama's nomic-embed-text model
import { aiConfig } from "./ai-config";
import { EmbeddingFunction, EmbeddingFunctionSpace } from "chromadb";

export interface OllamaEmbeddingOptions {
  model: string;
  baseURL: string;
  timeout?: number;
  batchSize?: number;
  maxConcurrent?: number;
  retryAttempts?: number;
  retryDelay?: number;
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Custom embedding function that implements the ChromaDB EmbeddingFunction interface
 * This function uses Ollama's nomic-embed-text model for generating embeddings
 */
export class OllamaEmbeddingFunction implements EmbeddingFunction {
  private model: string;
  private baseURL: string;
  private timeout: number;
  private batchSize: number;
  private maxConcurrent: number;
  private retryAttempts: number;
  private retryDelay: number;
  private onProgress?: (completed: number, total: number) => void;

  constructor(options: OllamaEmbeddingOptions) {
    this.model = options.model;
    this.baseURL = options.baseURL;
    this.timeout = options.timeout || 120000; // 2 minutes default (increased from 30s)
    this.batchSize = options.batchSize || 5; // Reduced from 5 to avoid overwhelming
    this.maxConcurrent = options.maxConcurrent || 2; // Limit concurrent requests
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 2000; // 2 seconds between retries
    this.onProgress = options.onProgress;
  }

  /**
   * Generate embeddings for an array of texts using Ollama's nomic-embed-text model
   * This method matches the interface expected by ChromaDB
   */
  public async generate(texts: string[]): Promise<number[][]> {
    try {
      console.log(
        `Generating embeddings for ${texts.length} text(s) using ${this.model}`
      );
      console.log(
        `Configuration: timeout=${this.timeout}ms, batchSize=${this.batchSize}, maxConcurrent=${this.maxConcurrent}`
      );

      const embeddings: number[][] = [];
      let completed = 0;

      // Process texts in smaller batches with controlled concurrency
      for (let i = 0; i < texts.length; i += this.batchSize) {
        const batch = texts.slice(i, i + this.batchSize);
        const batchNumber = Math.floor(i / this.batchSize) + 1;
        const totalBatches = Math.ceil(texts.length / this.batchSize);

        console.log(
          `Processing batch ${batchNumber}/${totalBatches} (${batch.length} texts)`
        );

        const batchEmbeddings = await this.generateBatchWithConcurrency(batch);
        embeddings.push(...batchEmbeddings);

        completed += batch.length;
        if (this.onProgress) {
          this.onProgress(completed, texts.length);
        }

        console.log(
          `Completed ${completed}/${texts.length} embeddings (${Math.round(
            (completed / texts.length) * 100
          )}%)`
        );

        // Add a small delay between batches to prevent overwhelming the server
        if (i + this.batchSize < texts.length) {
          await this.delay(500); // 500ms delay between batches
        }
      }

      console.log(`Successfully generated ${embeddings.length} embeddings`);
      return embeddings;
    } catch (error) {
      console.error("Error generating embeddings with Ollama:", error);
      throw new Error(
        `Failed to generate embeddings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Default space for this embedding function (cosine similarity works well for nomic-embed-text)
   */
  public defaultSpace(): EmbeddingFunctionSpace {
    return "cosine";
  }

  /**
   * Supported spaces for this embedding function
   */
  public supportedSpaces(): EmbeddingFunctionSpace[] {
    return ["cosine", "l2", "ip"];
  }

  /**
   * Get configuration for this embedding function
   */
  public getConfig() {
    return {
      name: "ollama-nomic-embed",
      model: this.model,
      baseURL: this.baseURL,
      timeout: this.timeout,
      batchSize: this.batchSize,
      maxConcurrent: this.maxConcurrent,
    };
  }

  /**
   * Validate configuration updates
   */
  public validateConfigUpdate(config: unknown): boolean {
    // Basic validation - can be extended as needed
    return typeof config === "object" && config !== null;
  }

  /**
   * Simple delay function for rate limiting
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate embeddings for a batch of texts with controlled concurrency
   */
  private async generateBatchWithConcurrency(
    texts: string[]
  ): Promise<number[][]> {
    const results: number[][] = [];

    // Process in smaller concurrent groups
    for (let i = 0; i < texts.length; i += this.maxConcurrent) {
      const concurrent = texts.slice(i, i + this.maxConcurrent);
      const promises = concurrent.map((text) =>
        this.generateSingleWithRetry(text)
      );
      const concurrentResults = await Promise.all(promises);
      results.push(...concurrentResults);
    }

    return results;
  }

  /**
   * Generate embeddings for a batch of texts (legacy method for compatibility)
   */
  private async generateBatch(texts: string[]): Promise<number[][]> {
    return this.generateBatchWithConcurrency(texts);
  }

  /**
   * Generate embedding for a single text with retry logic
   */
  private async generateSingleWithRetry(text: string): Promise<number[]> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.generateSingle(text);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.retryAttempts) {
          console.warn(
            `Embedding attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`,
            lastError.message
          );
          await this.delay(this.retryDelay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Generate embedding for a single text
   */
  private async generateSingle(text: string): Promise<number[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/api/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: text,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error("Invalid embedding response from Ollama");
      }

      return data.embedding;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Embedding request timed out after ${this.timeout}ms`);
      }

      throw error;
    }
  }
}

/**
 * Create an Ollama embedding function with default configuration
 */
export function createOllamaEmbeddingFunction(
  model: string = "nomic-embed-text",
  options?: Partial<OllamaEmbeddingOptions>
): OllamaEmbeddingFunction {
  return new OllamaEmbeddingFunction({
    model,
    baseURL: aiConfig.ollama.baseURL,
    timeout: 120000, // 2 minutes default
    batchSize: 5, // Smaller batches for better reliability
    maxConcurrent: 2, // Limit concurrent requests
    retryAttempts: 3,
    retryDelay: 2000,
    ...options,
  });
}

/**
 * Test the embedding function with a sample text
 */
export async function testOllamaEmbedding(
  text: string = "Hello, world!"
): Promise<void> {
  try {
    console.log("Testing Ollama embedding function...");

    const embeddingFunction = createOllamaEmbeddingFunction();
    const embeddings = await embeddingFunction.generate([text]);

    console.log(
      `Test successful! Generated embedding with ${embeddings[0].length} dimensions`
    );
    console.log(
      `First 5 dimensions: [${embeddings[0].slice(0, 5).join(", ")}...]`
    );
  } catch (error) {
    console.error("Embedding test failed:", error);
    throw error;
  }
}
