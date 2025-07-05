// PDF Processing Constants

// ChromaDB Configuration
export const CHROMADB_BASE_URL = "http://localhost:8000";

// Text Chunking Configuration
export const DEFAULT_TEXT_SPLITTER_CONFIG = {
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
};
