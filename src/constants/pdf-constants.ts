// PDF Processing Constants

// Text Chunking Configuration
export const DEFAULT_TEXT_SPLITTER_CONFIG = {
  chunkSize: 1250, // nomic-embed-text model supports up to 2000 tokens, so we set a chunk size of 1250 to allow for some buffer (0.75 words per token)
  overlap: 200, // 250 words overlap to ensure context is maintained between chunks
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
};
