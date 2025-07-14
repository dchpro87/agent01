// PDF Processing constraints

// Text Chunking Configuration
export const DEFAULT_TEXT_SPLITTER_CONFIG = {
  chunkSize: 1250, // nomic-embed-text has ctx size 8192 tokens, we aiming for 500 chunks. set a chunk size in chars of 1250 (0.75 words per token)
  overlap: 200, // 250 words overlap to ensure context is maintained between chunks
  separators: [
    '\n\n', // Paragraphs
    '\n', // Lines
    '. ', // Sentences
    '? ', // Questions
    '! ', // Exclamations
    '; ', // Semicolons
    ', ', // Commas
    ' ', // Words
    '', // Characters
  ],
};
