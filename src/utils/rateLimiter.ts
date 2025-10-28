import { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (use Redis in production for multi-instance deployments)
const rateLimitStore: RateLimitStore = {};

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number; // Maximum number of requests
  windowMs: number; // Time window in milliseconds
}

/**
 * Rate limiter middleware for Next.js API routes
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @param config - Rate limit configuration
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  config: RateLimitConfig = { maxRequests: 2, windowMs: 60 * 1000 } // Default: 2 requests per minute
): boolean {
  // Get client IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim() 
    : req.socket.remoteAddress || 'unknown';
  
  const now = Date.now();
  const key = `${ip}:${req.url}`;

  // Initialize or get existing rate limit data
  if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (config.maxRequests - 1).toString());
    res.setHeader('X-RateLimit-Reset', new Date(rateLimitStore[key].resetTime).toISOString());
    
    return true;
  }

  // Check if rate limit exceeded
  if (rateLimitStore[key].count >= config.maxRequests) {
    const resetIn = Math.ceil((rateLimitStore[key].resetTime - now) / 1000);
    
    res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', new Date(rateLimitStore[key].resetTime).toISOString());
    res.setHeader('Retry-After', resetIn.toString());
    
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${resetIn} seconds.`,
      retryAfter: resetIn,
    });
    
    return false;
  }

  // Increment request count
  rateLimitStore[key].count++;
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', (config.maxRequests - rateLimitStore[key].count).toString());
  res.setHeader('X-RateLimit-Reset', new Date(rateLimitStore[key].resetTime).toISOString());
  
  return true;
}

/**
 * Rate limiter middleware wrapper for cleaner API route implementation
 */
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  config?: RateLimitConfig
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const allowed = checkRateLimit(req, res, config);
    
    if (!allowed) {
      return; // Rate limit response already sent
    }
    
    return handler(req, res);
  };
}
