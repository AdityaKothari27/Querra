import type { NextApiRequest, NextApiResponse } from 'next';
import { GeminiProcessor } from '../../utils/ai_processor';
import { SecurityValidator, RateLimiter } from '../../utils/security';
import { logger, ErrorHandler, IntrusionDetector } from '../../utils/logging';

const ai_processor = new GeminiProcessor();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Security checks
    const clientIP = req.headers['x-forwarded-for'] as string || 
                    req.headers['x-real-ip'] as string || 
                    req.connection?.remoteAddress || 'unknown';

    // Rate limiting - more restrictive for chat (AI calls are expensive)
    const rateLimit = RateLimiter.checkRateLimit(clientIP, 30, 15 * 60 * 1000); // 30 requests per 15 min
    if (!rateLimit.allowed) {
      logger.security({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        details: `Chat rate limit exceeded for IP: ${clientIP}`
      }, req);
      return res.status(429).json({ 
        message: 'Too many requests. Please wait before sending another message.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      });
    }

    // Intrusion detection
    const securityEvents = IntrusionDetector.analyzeRequest(req, req.body);
    if (securityEvents.some(event => event.severity === 'CRITICAL' || event.severity === 'HIGH')) {
      return res.status(403).json({ message: 'Request blocked for security reasons' });
    }

    const { message, sources, conversationHistory = [], model = 'gemini-2.5-flash' } = req.body;
    
    // Input validation
    const messageValidation = SecurityValidator.validateInput(message, 5000); // 5KB limit for messages
    if (!messageValidation.isValid) {
      logger.security({
        type: 'MALICIOUS_INPUT',
        severity: 'HIGH',
        details: `Chat message validation failed: ${messageValidation.errors.join(', ')}`
      }, req);
      return res.status(400).json({ message: 'Message contains invalid content' });
    }

    // Validate sources if provided
    if (sources && Array.isArray(sources)) {
      for (const source of sources) {
        const sourceValidation = SecurityValidator.validateInput(source, 2000);
        if (!sourceValidation.isValid) {
          logger.security({
            type: 'MALICIOUS_INPUT',
            severity: 'MEDIUM',
            details: `Source URL validation failed: ${sourceValidation.errors.join(', ')}`
          }, req);
          return res.status(400).json({ message: 'Invalid source provided' });
        }
      }
    }

    logger.info('Chat request processed', req, { 
      messageLength: message.length,
      sourcesCount: sources?.length || 0, 
      model,
      remaining: rateLimit.remaining 
    });
    
    // Generate chat response using URL context or general chat based on model and sources
    const response = await ai_processor.generate_chat_response(
      messageValidation.sanitized || message, 
      sources || [], 
      conversationHistory,
      model
    );

    res.status(200).json({ message: response });
  } catch (error: any) {
    const errorResponse = ErrorHandler.logAndRespond(
      error,
      req,
      'I apologize, but I encountered an error. Please try again.',
      { model: req.body?.model }
    );
    res.status(500).json(errorResponse);
  }
}
