import type { NextApiRequest, NextApiResponse } from 'next';
import { GeminiProcessor } from '../../utils/ai_processor';

const ai_processor = new GeminiProcessor();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { filename, base64Content } = req.body;
    
    if (!base64Content) {
      return res.status(400).json({ message: 'Missing PDF content' });
    }
    
    // Use Gemini to extract text from the PDF
    const extractedText = await ai_processor.extractTextFromPdf(base64Content);
    
    res.status(200).json({ 
      filename,
      text: extractedText
    });
  } catch (error: any) {
    console.error('PDF extraction error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to extract text from PDF',
      text: `[Error extracting text from ${req.body.filename || 'PDF'}]`
    });
  }
} 