import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentExtractor } from '../../utils/extractor';
import { GeminiProcessor, OpenRouterProcessor } from '../../utils/ai_processor';
import { Database } from '../../utils/database';
import { SecurityValidator, RateLimiter } from '../../utils/security';
import { logger, ErrorHandler, IntrusionDetector } from '../../utils/logging';
import { withRateLimit } from '../../utils/rateLimiter';

const extractor = new ContentExtractor();
const ai_processor = new GeminiProcessor();
const db = new Database();

async function handler(
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

    // Rate limiting for report generation (more expensive operation)
    const rateLimit = RateLimiter.checkRateLimit(clientIP, 20, 15 * 60 * 1000); // 20 reports per 15 min
    if (!rateLimit.allowed) {
      logger.security({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        details: `Report generation rate limit exceeded for IP: ${clientIP}`
      }, req);
      return res.status(429).json({ 
        message: 'Too many report generation requests. Please wait before trying again.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      });
    }

    // Intrusion detection
    const securityEvents = IntrusionDetector.analyzeRequest(req, req.body);
    if (securityEvents.some(event => event.severity === 'CRITICAL' || event.severity === 'HIGH')) {
      return res.status(403).json({ message: 'Request blocked for security reasons' });
    }

    const { query, sources, documentIds, promptTemplate, generationMode = 'traditional', model = 'gemini-2.5-flash', userApiKeys } = req.body;
    
    // Input validation
    const queryValidation = SecurityValidator.validateInput(query, 2000);
    if (!queryValidation.isValid) {
      logger.security({
        type: 'MALICIOUS_INPUT',
        severity: 'HIGH',
        details: `Query validation failed: ${queryValidation.errors.join(', ')}`
      }, req);
      return res.status(400).json({ message: 'Query contains invalid content' });
    }

    // Validate sources
    if (sources && Array.isArray(sources)) {
      for (const source of sources) {
        const sourceValidation = SecurityValidator.validateInput(source, 2000);
        if (!sourceValidation.isValid) {
          logger.security({
            type: 'MALICIOUS_INPUT',
            severity: 'MEDIUM',
            details: `Source validation failed: ${sourceValidation.errors.join(', ')}`
          }, req);
          return res.status(400).json({ message: 'Invalid source URL provided' });
        }
      }
    }

    // Validate prompt template if provided
    if (promptTemplate) {
      const templateValidation = SecurityValidator.validateInput(promptTemplate, 5000);
      if (!templateValidation.isValid) {
        logger.security({
          type: 'MALICIOUS_INPUT',
          severity: 'MEDIUM',
          details: `Prompt template validation failed: ${templateValidation.errors.join(', ')}`
        }, req);
        return res.status(400).json({ message: 'Invalid prompt template' });
      }
    }

    logger.info('Report generation request', req, { 
      generationMode, 
      model, 
      sourcesCount: sources?.length || 0, 
      documentsCount: documentIds?.length || 0,
      remaining: rateLimit.remaining 
    });
    
    let report: string;
    const sanitizedQuery = queryValidation.sanitized || query;
    
    // Determine which processor to use based on model and user keys
    let processorToUse: GeminiProcessor | OpenRouterProcessor;
    
    if (model && model.includes('minimax')) {
      // OpenRouter model
      processorToUse = userApiKeys?.openrouter
        ? new OpenRouterProcessor(userApiKeys.openrouter)
        : new OpenRouterProcessor();
    } else {
      // Gemini or Groq model
      processorToUse = userApiKeys?.gemini || userApiKeys?.groq
        ? new GeminiProcessor(userApiKeys.gemini, userApiKeys.groq)
        : ai_processor;
    }
    
    // If using custom OpenRouter model, update the model variable
    const modelToUse = userApiKeys?.openrouterModel || model;
    
    if (generationMode === 'fast') {
      // Fast mode: Use URL context without content extraction
      logger.info('Using fast mode with URL context', req);
      
      // For fast mode, we only use web sources (URLs), documents still need extraction
      if (documentIds && documentIds.length > 0) {
        // If documents are included, fall back to traditional mode
        logger.info('Documents detected, falling back to traditional mode', req);
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
        report = await processorToUse.generate_report(sanitizedQuery, allContents, promptTemplate, modelToUse);
      } else {
        // Pure fast mode with only URLs
        // Note: OpenRouter doesn't have generate_report_fast, so fall back to traditional for OpenRouter models
        if (processorToUse instanceof OpenRouterProcessor) {
          const webContents = await Promise.all(
            sources.map((url: string) => extractor.extract(url))
          );
          report = await processorToUse.generate_report(sanitizedQuery, webContents, promptTemplate, modelToUse);
        } else {
          report = await (processorToUse as GeminiProcessor).generate_report_fast(sanitizedQuery, sources, promptTemplate, modelToUse);
        }
        
        // Add mode indicator to the report
        const currentDate = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        report = `${report}\n`;
      }
    } else {
      // Traditional mode: Extract content from web sources
      logger.info('Using traditional mode with content extraction', req);
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
      report = await processorToUse.generate_report(sanitizedQuery, allContents, promptTemplate, modelToUse);
      
      // Add mode indicator to the report
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const totalSources = sources.length + (documentIds || []).length;
      report = `${report}\n`;
    }
    
    // Save to database (include both web sources and document IDs)
    const allSources = [
      ...sources,
      ...(documentIds || []).map((id: number) => `document:${id}`)
    ];
    await db.save_report(sanitizedQuery, report, allSources);

    logger.info('Report generated successfully', req, { 
      reportLength: report.length,
      sourcesUsed: allSources.length 
    });

    res.status(200).json({ report });
  } catch (error: any) {
    const errorResponse = ErrorHandler.logAndRespond(
      error,
      req,
      'Failed to generate report. Please try again.',
      { 
        generationMode: req.body?.generationMode,
        model: req.body?.model,
        sourcesCount: req.body?.sources?.length || 0 
      }
    );
    res.status(500).json({
      ...errorResponse,
      report: 'Failed to generate report. Please try again.'
    });
  }
}

export default withRateLimit(handler, { maxRequests: 2, windowMs: 60 * 1000 }); // 2 requests per minute per IP 