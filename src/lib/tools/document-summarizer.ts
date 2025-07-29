import { z } from "zod";
import { tool } from "ai";
import { pdfAttachmentStore } from "@/lib/pdf-attachment-store";
import pdfParse from "pdf-parse";

export const document_summarizer = tool({
  description:
    "Summarize PDF documents that have been attached to the conversation.",
  parameters: z.object({
    filenamePattern: z
      .string()
      .optional()
      .describe(
        "Optional filename for specific PDF documents. If not provided, will list available PDFs."
      ),
    summaryLength: z
      .enum(["brief", "detailed", "comprehensive"])
      .optional()
      .default("brief")
      .describe("Length of the summary to generate"),
  }),
  execute: async ({ filenamePattern, summaryLength = "brief" }) => {
    console.log("🔧 documentSummarizer tool called with:", {
      filenamePattern,
      summaryLength,
    });

    try {
      const allPDFs = pdfAttachmentStore.getAllPDFAttachments();

      console.log("📄 No of available PDFs:", allPDFs.length);

      if (allPDFs.length === 0) {
        return "No PDF documents are currently available. Please attach PDF files to the conversation first.";
      }

      // If no filename pattern provided, list available PDFs
      if (!filenamePattern) {
        const pdfList = allPDFs
          .map(
            (pdf, index) =>
              `${index + 1}. ${pdf.name} (${Math.round(
                pdf.size / 1024
              )}KB, uploaded ${pdf.uploadedAt.toLocaleString()})`
          )
          .join("\n");

        return `Available PDF documents (${allPDFs.length} total):\n\n${pdfList}\n\nTo summarize a specific document, call this tool again with a filename pattern (e.g., "report" to find files containing "report" in the name).`;
      }

      // Find PDFs matching the pattern
      const matchingPDFs =
        pdfAttachmentStore.getPDFAttachmentsByName(filenamePattern);

      if (matchingPDFs.length === 0) {
        const availableNames = allPDFs.map((pdf) => pdf.name).join(", ");
        return `No PDF documents found matching "${filenamePattern}". Available documents: ${availableNames}`;
      }

      if (matchingPDFs.length > 1) {
        const matchList = matchingPDFs
          .map(
            (pdf, index) =>
              `${index + 1}. ${pdf.name} (${Math.round(pdf.size / 1024)}KB)`
          )
          .join("\n");

        return `Multiple PDF documents found matching "${filenamePattern}":\n\n${matchList}\n\nPlease be more specific with the filename pattern to select a single document.`;
      }

      // Process the single matching PDF
      const pdf = matchingPDFs[0];
      console.log(`📄 Processing PDF: ${pdf.name} (${pdf.size} bytes)`);

      // Parse the PDF content
      const buffer = Buffer.from(pdf.data);
      const pdfData = await pdfParse(buffer);

      if (!pdfData.text || pdfData.text.trim().length === 0) {
        return `The PDF "${pdf.name}" appears to be empty or contains no extractable text content.`;
      }

      // Generate summary based on requested length
      const text = pdfData.text.trim();
      const wordCount = text.split(/\s+/).length;
      const pageCount = pdfData.numpages || 1;

      let summary = "";

      switch (summaryLength) {
        case "brief":
          summary = generateBriefSummary(text, pdf.name, pageCount, wordCount);
          break;
        case "comprehensive":
          summary = generateComprehensiveSummary(
            text,
            pdf.name,
            pageCount,
            wordCount
          );
          break;
        case "detailed":
        default:
          summary = generateDetailedSummary(
            text,
            pdf.name,
            pageCount,
            wordCount
          );
          break;
      }

      return summary;
    } catch (error) {
      console.error("Error summarizing PDF:", error);
      throw new Error(
        `Failed to summarize the PDF document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

function generateBriefSummary(
  text: string,
  filename: string,
  pageCount: number,
  wordCount: number
): string {
  // Extract first few sentences as a brief summary
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const briefContent =
    sentences.slice(0, 3).join(". ").trim() +
    (sentences.length > 3 ? "..." : "");

  return `📄 **Brief Summary of "${filename}"**

**Document Info:** ${pageCount} pages, ~${wordCount.toLocaleString()} words

**Overview:** ${briefContent}

This is a brief summary. Use summaryLength "detailed" or "comprehensive" for more thorough analysis.`;
}

function generateDetailedSummary(
  text: string,
  filename: string,
  pageCount: number,
  wordCount: number
): string {
  // Extract key sections and provide structured summary
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 50);
  const keyParagraphs = paragraphs.slice(0, 5);

  // Look for common document sections
  const hasTableOfContents = /table\s+of\s+contents|contents/i.test(text);
  const hasAbstract = /abstract|summary|executive\s+summary/i.test(text);
  const hasConclusion = /conclusion|summary|final|end/i.test(text);

  let structuredContent = "";

  if (hasAbstract) {
    const abstractMatch = text.match(
      /(?:abstract|executive\s+summary)[:\s]*((?:.|\n)*?)(?:\n\s*\n|\n\s*[A-Z])/i
    );
    if (abstractMatch) {
      structuredContent += `**Abstract/Summary:**\n${abstractMatch[1]
        .trim()
        .substring(0, 500)}...\n\n`;
    }
  }

  structuredContent += `**Key Content:**\n`;
  keyParagraphs.forEach((para, index) => {
    const cleanPara = para.trim().substring(0, 200);
    structuredContent += `${index + 1}. ${cleanPara}${
      cleanPara.length === 200 ? "..." : ""
    }\n\n`;
  });

  if (hasConclusion) {
    const conclusionMatch = text.match(
      /(?:conclusion|final\s+thoughts?)[:\s]*((?:.|\n)*?)(?:\n\s*\n|$)/i
    );
    if (conclusionMatch) {
      structuredContent += `**Conclusion:**\n${conclusionMatch[1]
        .trim()
        .substring(0, 300)}...\n\n`;
    }
  }

  return `📄 **Detailed Summary of "${filename}"**

**Document Info:** ${pageCount} pages, ~${wordCount.toLocaleString()} words
**Structure:** ${hasTableOfContents ? "✓" : "✗"} Table of Contents, ${
    hasAbstract ? "✓" : "✗"
  } Abstract, ${hasConclusion ? "✓" : "✗"} Conclusion

${structuredContent}

**Analysis:** This document appears to be ${categorizeDocument(text)} with ${
    pageCount > 10 ? "substantial" : pageCount > 5 ? "moderate" : "concise"
  } content coverage.`;
}

function generateComprehensiveSummary(
  text: string,
  filename: string,
  pageCount: number,
  wordCount: number
): string {
  // Comprehensive analysis with multiple perspectives
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 50);

  // Extract different types of content
  const headings = text.match(/^[A-Z][A-Za-z\s]+$/gm) || [];
  const numberedLists = text.match(/^\d+\.\s+.+$/gm) || [];
  const bulletPoints = text.match(/^[•·\-\*]\s+.+$/gm) || [];

  // Analyze document structure
  const structureAnalysis = analyzeDocumentStructure(text);

  // Key themes analysis (simplified)
  const keyWords = extractKeyWords(text);

  let comprehensiveContent = `📄 **Comprehensive Analysis of "${filename}"**

**Document Metadata:**
- Pages: ${pageCount}
- Word Count: ~${wordCount.toLocaleString()}
- Paragraphs: ${paragraphs.length}
- Headings: ${headings.length}
- Lists: ${numberedLists.length} numbered, ${bulletPoints.length} bullet points

**Document Structure:**
${structureAnalysis}

**Key Themes & Topics:**
${keyWords.slice(0, 10).join(", ")}

**Content Overview:**
`;

  // Provide detailed content breakdown
  const sections = Math.min(8, paragraphs.length);
  for (let i = 0; i < sections; i++) {
    const para = paragraphs[i].trim();
    comprehensiveContent += `\n**Section ${i + 1}:**\n${para.substring(
      0,
      400
    )}${para.length > 400 ? "..." : ""}\n`;
  }

  comprehensiveContent += `\n**Document Assessment:**
- Content Type: ${categorizeDocument(text)}
- Reading Level: ${assessReadingLevel(text)}
- Primary Focus: ${identifyPrimaryFocus(text)}
- Recommendation: ${generateRecommendation(text, pageCount)}`;

  return comprehensiveContent;
}

function categorizeDocument(text: string): string {
  if (
    /research|study|analysis|methodology|results|findings|conclusion/i.test(
      text
    )
  ) {
    return "Research/Academic Document";
  } else if (/contract|agreement|terms|conditions|legal|clause/i.test(text)) {
    return "Legal/Contractual Document";
  } else if (/manual|guide|instructions|how\s+to|procedure|step/i.test(text)) {
    return "Manual/Instructional Document";
  } else if (/report|quarterly|annual|financial|performance/i.test(text)) {
    return "Business/Financial Report";
  } else if (/proposal|plan|strategy|recommendation|objective/i.test(text)) {
    return "Strategic/Planning Document";
  } else {
    return "General Document";
  }
}

function analyzeDocumentStructure(text: string): string {
  const hasIntro = /introduction|overview|background/i.test(text);
  const hasMethod = /method|approach|procedure|process/i.test(text);
  const hasResults = /result|finding|outcome|data/i.test(text);
  const hasConclusion = /conclusion|summary|final/i.test(text);

  return `${hasIntro ? "✓" : "✗"} Introduction, ${
    hasMethod ? "✓" : "✗"
  } Methodology, ${hasResults ? "✓" : "✗"} Results, ${
    hasConclusion ? "✓" : "✗"
  } Conclusion`;
}

function extractKeyWords(text: string): string[] {
  // Simple keyword extraction (would be better with NLP libraries)
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4 && word.length < 20);

  const frequency: { [key: string]: number } = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([word]) => word);
}

function assessReadingLevel(text: string): string {
  const sentences = text.split(/[.!?]+/).length;
  const words = text.split(/\s+/).length;
  const avgWordsPerSentence = words / sentences;

  if (avgWordsPerSentence > 25) return "Advanced/Technical";
  if (avgWordsPerSentence > 20) return "Intermediate/Professional";
  if (avgWordsPerSentence > 15) return "Standard/Business";
  return "Basic/Accessible";
}

function identifyPrimaryFocus(text: string): string {
  if (/data|statistics|numbers|analysis|chart|graph/i.test(text))
    return "Data-Driven Analysis";
  if (/policy|procedure|process|workflow/i.test(text))
    return "Process Documentation";
  if (/strategy|planning|future|goal|objective/i.test(text))
    return "Strategic Planning";
  if (/technical|system|software|hardware|implementation/i.test(text))
    return "Technical Documentation";
  if (/financial|budget|cost|revenue|profit/i.test(text))
    return "Financial Analysis";

  return "General Information";
}

function generateRecommendation(text: string, pageCount: number): string {
  if (pageCount > 20) {
    return "This is a substantial document that may benefit from section-by-section review.";
  } else if (pageCount > 10) {
    return "This is a moderate-length document suitable for detailed review.";
  } else {
    return "This is a concise document that can be reviewed quickly.";
  }
}
