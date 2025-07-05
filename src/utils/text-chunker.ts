export interface TextChunk {
  content: string;
  index: number;
  start: number;
  end: number;
}

export interface ChunkingOptions {
  chunkSize: number;
  overlap: number;
  separators?: string[];
}

export class RecursiveTextSplitter {
  private chunkSize: number;
  private overlap: number;
  private separators: string[];

  constructor(options: ChunkingOptions) {
    this.chunkSize = options.chunkSize;
    this.overlap = options.overlap;
    this.separators = options.separators || ["\n\n", "\n", " ", ""];
  }

  /**
   * Split text using recursive approach with different separators
   */
  splitText(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    const finalChunks = this.recursiveSplit(text, this.separators);

    // Convert to TextChunk objects with metadata
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

    // If no separator left, just split by character count
    if (!separator) {
      return this.splitByLength(text);
    }

    const splits = text.split(separator);
    const goodSplits: string[] = [];

    for (const split of splits) {
      if (split.length <= this.chunkSize) {
        goodSplits.push(split);
      } else {
        // Split is too long, try next separator
        const subSplits = this.recursiveSplit(split, remainingSeparators);
        goodSplits.push(...subSplits);
      }
    }

    // Merge small chunks together with overlap
    return this.mergeChunks(goodSplits, separator);
  }

  private splitByLength(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + this.chunkSize;

      // If we're not at the end of the text, try to find a good breaking point
      if (end < text.length) {
        // Look for whitespace near the end
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
        // Current chunk is good as is, start a new one
        merged.push(currentChunk);
        currentChunk = nextChunk;
      }
    }

    // Add the last chunk
    merged.push(currentChunk);

    // Apply overlap between merged chunks
    return this.applyOverlap(merged);
  }

  private applyOverlap(chunks: string[]): string[] {
    if (chunks.length <= 1 || this.overlap === 0) return chunks;

    const result: string[] = [chunks[0]];

    for (let i = 1; i < chunks.length; i++) {
      const prevChunk = chunks[i - 1];
      const currentChunk = chunks[i];

      // Get overlap from previous chunk
      const overlapText = prevChunk.slice(-this.overlap);

      // Add overlap to current chunk if it doesn't already contain it
      if (!currentChunk.startsWith(overlapText)) {
        result.push(overlapText + currentChunk);
      } else {
        result.push(currentChunk);
      }
    }

    return result;
  }
}

/**
 * Default text splitter with commonly used settings
 */
export const createDefaultTextSplitter = () => {
  return new RecursiveTextSplitter({
    chunkSize: 2500,
    overlap: 250,
    separators: [
      "\n\n", // Paragraphs
      "\n", // Lines
      ". ", // Sentences
      "? ", // Questions
      "! ", // Exclamations
      "; ", // Semicolons
      ", ", // Commas
      " ", // Words
      "", // Characters
    ],
  });
};
