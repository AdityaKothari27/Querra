/**
 * Advanced API Protection Strategies
 * Additional security measures for production deployment
 */

// 1. API Key Authentication for production
export const API_PROTECTION = {
  // Add this to your API routes for additional protection
  validateAPIKey: (req: any) => {
    const apiKey = req.headers['x-api-key'];
    const validKeys = process.env.VALID_API_KEYS?.split(',') || [];
    return validKeys.includes(apiKey);
  },

  // CORS configuration
  corsConfig: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] // Replace with your domain
      : ['http://localhost:3000'],
    credentials: true,
  },

  // Request signing for critical operations
  signRequest: (payload: any, secret: string) => {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  }
};

// 2. Advanced rate limiting strategies
export const ADVANCED_RATE_LIMITING = {
  // Different limits based on operation cost
  AI_OPERATIONS: {
    'gemini-3-flash-preview': { limit: 10, window: 15 * 60 * 1000 }, // More expensive
    'gemini-2.5-flash': { limit: 30, window: 15 * 60 * 1000 }, // Cheaper
    'kimi': { limit: 25, window: 15 * 60 * 1000 }
  },

  // Progressive penalties for abuse
  PENALTY_MULTIPLIERS: {
    1: 1,    // First offense
    2: 2,    // Second offense - 2x longer timeout  
    3: 4,    // Third offense - 4x longer timeout
    4: 24    // Fourth offense - 24 hour ban
  }
};

// 3. Content filtering for AI safety
export const CONTENT_SAFETY = {
  FORBIDDEN_TOPICS: [
    'how to make explosives',
    'illegal activities', 
    'harmful instructions',
    'personal information extraction'
  ],

  checkContent: (text: string) => {
    const lowerText = text.toLowerCase();
    return CONTENT_SAFETY.FORBIDDEN_TOPICS.some(topic => 
      lowerText.includes(topic.toLowerCase())
    );
  }
};

// 4. Usage analytics and abuse detection
export const USAGE_ANALYTICS = {
  trackUsage: (ip: string, endpoint: string, tokens: number) => {
    // Track high-volume users
    // Detect unusual patterns
    // Flag potential abuse
  },

  detectAnomalies: (usage: any[]) => {
    // ML-based anomaly detection
    // Flag suspicious patterns
    // Auto-ban abusive IPs
  }
};

export default {
  API_PROTECTION,
  ADVANCED_RATE_LIMITING,
  CONTENT_SAFETY,
  USAGE_ANALYTICS
};
