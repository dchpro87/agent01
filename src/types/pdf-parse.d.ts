declare module "pdf-parse" {
  interface PDFInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    Title?: string;
    Author?: string;
    Subject?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: Date;
    ModDate?: Date;
    [key: string]: unknown;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: Record<string, unknown> | null;
    text: string;
    version: string;
  }

  function pdfParse(
    buffer: Buffer,
    options?: Record<string, unknown>
  ): Promise<PDFData>;

  export = pdfParse;
}
