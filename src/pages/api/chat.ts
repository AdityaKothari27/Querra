import type { NextApiRequest, NextApiResponse } from 'next';
import { GeminiProcessor } from '../../utils/ai_processor';
import { withSecurity } from '../../utils/middleware';
import { SecurityValidator } from '../../utils/security';
import { logger } from '../../utils/logging';
import { withRateLimit } from '../../utils/rateLimiter';

const ai_processor = new GeminiProcessor();

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { message, sources, documentIds = [], conversationHistory = [], model = 'gemini-2.5-flash', userApiKeys } = req.body;
  
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
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Connection': 'keep-alive',
    'Transfer-Encoding': 'chunked',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  try {
    let chunkCount = 0;
    
    // Use user's API key if provided
    const processorToUse = userApiKeys?.gemini 
      ? new GeminiProcessor(userApiKeys.gemini)
      : ai_processor;
    
    // Generate streaming chat response
    await processorToUse.generate_chat_response_stream(
      messageValidation.sanitized || message, 
      sources || [], 
      documentIds || [],
      conversationHistory,
      model,
      (chunk: string) => {
        chunkCount++;
        // Send each chunk as it's generated
        res.write(chunk);
      }
    );
    
    // Signal completion
    res.end();
  } catch (error) {
    logger.error('Chat streaming error', error as Error, req);
    res.write('Error: Failed to generate response. Please try again.');
    res.end();
  }
}

export default withRateLimit(
  withSecurity(handler, {
    rateLimit: {
      maxRequests: 30, // More restrictive for chat (AI calls are expensive)
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    validateInput: false, // Disabled to allow coding discussions and examples
    logRequests: true
  }),
  { maxRequests: 2, windowMs: 60 * 1000 } // 2 requests per minute per IP
);
