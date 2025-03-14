import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentExtractor } from '../../utils/extractor';
import { GeminiProcessor } from '../../utils/ai_processor';
import { Database } from '../../utils/database';

const extractor = new ContentExtractor();
const ai_processor = new GeminiProcessor();
const db = new Database();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query, sources, documentIds, promptTemplate } = req.body;
    
    // Extract content from web sources
    const webContents = await Promise.all(
      sources.map((url: string) => extractor.extract(url))
    );
    
    // Get content from documents
    const documentContents = await Promise.all(
      (documentIds || []).map(async (id: number) => {
        const content = await db.get_document_content(id);
        return content;
      })
    );
    
    // Combine all contents
    const allContents = [...webContents, ...documentContents];

    // Generate report
    const report = await ai_processor.generate_report(query, allContents, promptTemplate);
    
    // Save to database (include both web sources and document IDs)
    const allSources = [
      ...sources,
      ...(documentIds || []).map((id: number) => `document:${id}`)
    ];
    await db.save_report(query, report, allSources);

    res.status(200).json({ report });
  } catch (error: any) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      message: error.message || 'Internal server error',
      report: 'Failed to generate report. Please try again.' 
    });
  }
} 