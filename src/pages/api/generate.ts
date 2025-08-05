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
    const { query, sources, documentIds, promptTemplate, generationMode = 'traditional' } = req.body;
    
    let report: string;
    
    if (generationMode === 'fast') {
      // Fast mode: Use URL context without content extraction
      console.log('Using fast mode with URL context');
      
      // For fast mode, we only use web sources (URLs), documents still need extraction
      if (documentIds && documentIds.length > 0) {
        // If documents are included, fall back to traditional mode
        console.log('Documents detected, falling back to traditional mode');
        const webContents = await Promise.all(
          sources.map((url: string) => extractor.extract(url))
        );
        
        const documentContents = await Promise.all(
          documentIds.map(async (id: number) => {
            const content = await db.get_document_content(id);
            return content;
          })
        );
        
        const allContents = [...webContents, ...documentContents];
        report = await ai_processor.generate_report(query, allContents, promptTemplate);
      } else {
        // Pure fast mode with only URLs
        report = await ai_processor.generate_report_fast(query, sources, promptTemplate);
        
        // Add mode indicator to the report
        const currentDate = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        report = `${report}\n\n---\n\n**Report Generation Details:**\n- Mode: Fast Analysis (URL Context)\n- Generated: ${currentDate}\n- Processing Time: ~10-20 seconds\n- Sources: ${sources.length} web sources`;
      }
    } else {
      // Traditional mode: Extract content from web sources
      console.log('Using traditional mode with content extraction');
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
      report = await ai_processor.generate_report(query, allContents, promptTemplate);
      
      // Add mode indicator to the report
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const totalSources = sources.length + (documentIds || []).length;
      report = `${report}\n\n---\n\n**Report Generation Details:**\n- Mode: Thorough Analysis (Content Extraction)\n- Generated: ${currentDate}\n- Processing Time: ~30-60 seconds\n- Sources: ${sources.length} web sources${(documentIds || []).length > 0 ? ` + ${(documentIds || []).length} documents` : ''}`;
    }
    
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