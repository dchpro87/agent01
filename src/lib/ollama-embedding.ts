// Custom ChromaDB embedding function that uses Ollama's nomic-embed-text model
import { aiConfig } from "./ai-config";
import { EmbeddingFunction, EmbeddingFunctionSpace } from "chromadb";

export interface OllamaEmbeddingOptions {
  model: string;
  baseURL: string;
  timeout?: number;
}

/**
 * Custom embedding function that implements the ChromaDB EmbeddingFunction interface
 * This function uses Ollama's nomic-embed-text model for generating embeddings
 */
export class OllamaEmbeddingFunction implements EmbeddingFunction {
  private model: string;
  private baseURL: string;
  private timeout: number;

  constructor(options: OllamaEmbeddingOptions) {
    this.model = options.model;
    this.baseURL = options.baseURL;
    this.timeout = options.timeout || 30000; // 30 seconds default
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

      const embeddings: number[][] = [];

      // Process texts in batches to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchEmbeddings = await this.generateBatch(batch);
        embeddings.push(...batchEmbeddings);
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
   * Generate embeddings for a batch of texts
   */
  private async generateBatch(texts: string[]): Promise<number[][]> {
    const promises = texts.map((text) => this.generateSingle(text));
    return Promise.all(promises);
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
  model: string = "nomic-embed-text"
): OllamaEmbeddingFunction {
  return new OllamaEmbeddingFunction({
    model,
    baseURL: aiConfig.ollama.baseURL,
    timeout: 30000,
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
