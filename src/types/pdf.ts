// PDF Processing Types

// Text Chunking Options Interface
export interface ChunkingOptions {
  chunkSize: number;
  overlap: number;
  separators?: string[];
}

// Text Chunk Interface
export interface TextChunk {
  content: string;
  index: number;
  start: number;
  end: number;
}
