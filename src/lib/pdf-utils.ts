// Server-side PDF processing utility
export async function parsePDF(buffer: Buffer) {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    return await pdfParse(buffer);
  } catch (error) {
    throw new Error(
      `Failed to parse PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[\f\r]/g, "")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}
