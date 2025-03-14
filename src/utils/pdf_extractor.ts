import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import pdfParse from 'pdf-parse';

export class PdfExtractor {
  async extract(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error(`Error extracting text from PDF: ${filePath}`, error);
      return `[Unable to extract content from PDF: ${filePath}]`;
    }
  }
} 