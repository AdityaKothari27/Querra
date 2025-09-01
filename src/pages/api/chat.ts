import type { NextApiRequest, NextApiResponse } from 'next';
import { GeminiProcessor } from '../../utils/ai_processor';
import { withSecurity } from '../../utils/middleware';
import { SecurityValidator } from '../../utils/security';
import { logger } from '../../utils/logging';

const ai_processor = new GeminiProcessor();

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { message, sources, documentIds = [], conversationHistory = [], model = 'gemini-2.5-flash' } = req.body;
  
  // Input validation
  const messageValidation = SecurityValidator.validateInput(message, 5000); // 5KB limit for messages
  if (!messageValidation.isValid) {
    return res.status(400).json({ message: 'Message contains invalid content' });
  }

  // Validate sources if provided
  if (sources && Array.isArray(sources)) {
    for (const source of sources) {
      const sourceValidation = SecurityValidator.validateInput(source, 2000);
      if (!sourceValidation.isValid) {
        return res.status(400).json({ message: 'Invalid source provided' });
      }
    }
  }

  // Validate document IDs if provided
  if (documentIds && Array.isArray(documentIds)) {
    for (const docId of documentIds) {
      if (!Number.isInteger(docId) || docId < 0) {
        return res.status(400).json({ message: 'Invalid document ID provided' });
      }
    }
  }

  // Set up Server-Sent Events headers for streaming
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  try {
    console.log('🚀 Starting chat streaming with model:', model);
    let chunkCount = 0;
    
    // Generate streaming chat response
    await ai_processor.generate_chat_response_stream(
      messageValidation.sanitized || message, 
      sources || [], 
      documentIds || [],
      conversationHistory,
      model,
      (chunk: string) => {
        chunkCount++;
        console.log(`📦 Chunk ${chunkCount}:`, chunk.length, 'chars -', chunk.substring(0, 50) + '...');
        // Send each chunk as it's generated
        res.write(chunk);
      }
    );
    
    console.log('✅ Streaming completed. Total chunks:', chunkCount);
    // Signal completion
    res.end();
  } catch (error) {
    logger.error('Chat streaming error', error as Error, req);
    res.write('Error: Failed to generate response. Please try again.');
    res.end();
  }
}

export default withSecurity(handler, {
  rateLimit: {
    maxRequests: 30, // More restrictive for chat (AI calls are expensive)
    windowMs: 15 * 60 * 1000 // 15 minutes
  },
  validateInput: false, // Disabled to allow coding discussions and examples
  logRequests: true
});
