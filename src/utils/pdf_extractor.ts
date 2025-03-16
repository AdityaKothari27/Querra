import pdfParse from 'pdf-parse';
import fs from 'fs';

export class PdfExtractor {
  async extract(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      return this.extractFromBuffer(dataBuffer);
    } catch (error) {
      console.error(`Error extracting text from PDF: ${filePath}`, error);
      return `[Unable to extract content from PDF]`;
    }
  }

  async extractFromBuffer(buffer: Buffer | string): Promise<string> {
    try {
      // If string is provided (filepath), try to read it as buffer
      const dataBuffer = typeof buffer === 'string' 
        ? fs.readFileSync(buffer) 
        : buffer;
      
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error(`Error extracting text from PDF buffer`, error);
      return `[Unable to extract content from PDF]`;
    }
  }
} 