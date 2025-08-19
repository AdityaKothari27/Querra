import type { NextApiRequest, NextApiResponse } from 'next';
import { SecurityValidator, RateLimiter } from './security';
import { logger, IntrusionDetector } from './logging';
import type { SecurityEvent } from './logging';

export interface SecurityMiddlewareOptions {
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  requireAuth?: boolean;
  validateInput?: boolean;
  logRequests?: boolean;
}

/**
 * Security middleware for API routes
 */
export function withSecurity(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options: SecurityMiddlewareOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Set security headers
      setSecurityHeaders(res);

      // Get client IP
      const clientIP = getClientIP(req);

      // Intrusion detection
      const securityEvents = IntrusionDetector.analyzeRequest(req, req.body);
      const highRiskEvents = securityEvents.filter((event: SecurityEvent) => 
        event.severity === 'CRITICAL' || event.severity === 'HIGH'
      );

      if (highRiskEvents.length > 0) {
        logger.security({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          details: `Request blocked due to security events: ${highRiskEvents.map((e: SecurityEvent) => e.type).join(', ')}`
        }, req);
        return res.status(403).json({ message: 'Access denied' });
      }

      // Rate limiting
      if (options.rateLimit) {
        const rateLimit = RateLimiter.checkRateLimit(
          clientIP,
          options.rateLimit.maxRequests,
          options.rateLimit.windowMs
        );

        if (!rateLimit.allowed) {
          logger.security({
            type: 'RATE_LIMIT_EXCEEDED',
            severity: 'MEDIUM',
            details: `Rate limit exceeded for ${req.url}`
          }, req);
          return res.status(429).json({
            message: 'Too many requests',
            retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
          });
        }

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', options.rateLimit.maxRequests);
        res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
        res.setHeader('X-RateLimit-Reset', rateLimit.resetTime);
      }

      // Request size validation
      const sizeValidation = SecurityValidator.validateRequestSize(req);
      if (!sizeValidation.isValid) {
        logger.security({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          details: `Request size validation failed: ${sizeValidation.errors.join(', ')}`
        }, req);
        return res.status(413).json({ message: 'Request too large' });
      }

      // Input validation for POST/PUT requests
      if (options.validateInput && (req.method === 'POST' || req.method === 'PUT')) {
        if (req.body && typeof req.body === 'object') {
          const validationResult = validateRequestBody(req.body);
          if (!validationResult.isValid) {
            logger.security({
              type: 'MALICIOUS_INPUT',
              severity: 'HIGH',
              details: `Request body validation failed: ${validationResult.errors.join(', ')}`
            }, req);
            return res.status(400).json({ message: 'Invalid request data' });
          }
        }
      }

      // Log request if enabled
      if (options.logRequests) {
        logger.info(`${req.method} ${req.url}`, req, {
          userAgent: req.headers['user-agent'],
          contentLength: req.headers['content-length']
        });
      }

      // Call the actual handler
      await handler(req, res);

    } catch (error) {
      logger.error('Security middleware error', error as Error, req);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}

/**
 * Set security headers
 */
function setSecurityHeaders(res: NextApiResponse) {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;");
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

/**
 * Get client IP address
 */
function getClientIP(req: NextApiRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.connection?.remoteAddress ||
    'unknown'
  );
}

/**
 * Validate request body recursively
 */
function validateRequestBody(body: any, path: string = ''): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof body === 'string') {
    const validation = SecurityValidator.validateInput(body);
    if (!validation.isValid) {
      errors.push(...validation.errors.map((err: string) => `${path}: ${err}`));
    }
  } else if (Array.isArray(body)) {
    body.forEach((item, index) => {
      const validation = validateRequestBody(item, `${path}[${index}]`);
      errors.push(...validation.errors);
    });
  } else if (typeof body === 'object' && body !== null) {
    Object.entries(body).forEach(([key, value]) => {
      const validation = validateRequestBody(value, path ? `${path}.${key}` : key);
      errors.push(...validation.errors);
    });
  }

  return { isValid: errors.length === 0, errors };
}

export default withSecurity;
