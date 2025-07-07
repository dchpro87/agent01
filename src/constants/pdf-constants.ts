// PDF Processing Constants

// ChromaDB Configuration
export const CHROMADB_BASE_URL = "http://localhost:8000";

// Text Chunking Configuration
export const DEFAULT_TEXT_SPLITTER_CONFIG = {
  chunkSize: 670, // nomic-embed-text model supports up to 2000 tokens, so we set a chunk size of 670 to allow for some buffer
  overlap: 30,
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
