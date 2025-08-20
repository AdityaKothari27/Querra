import { NextApiRequest } from 'next';
import crypto from 'crypto';

// Environment check
const isProduction = process.env.NODE_ENV === 'production';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';
  message: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface SecurityEvent {
  type: 'RATE_LIMIT_EXCEEDED' | 'MALICIOUS_INPUT' | 'UNAUTHORIZED_ACCESS' | 'FILE_UPLOAD_BLOCKED' | 'SUSPICIOUS_ACTIVITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  ip?: string;
  userAgent?: string;
  payload?: any;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private securityEvents: SecurityEvent[] = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    req?: NextApiRequest,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ip: req ? this.getClientIP(req) : undefined,
      userAgent: req?.headers['user-agent'],
      endpoint: req?.url,
      method: req?.method,
      metadata
    };
  }

  private getClientIP(req: NextApiRequest): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.connection?.remoteAddress ||
      'unknown'
    );
  }

  info(message: string, req?: NextApiRequest, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('INFO', message, req, metadata);
    this.logs.push(entry);
    
    if (!isProduction) {
      console.log(`[INFO] ${entry.timestamp} - ${message}`, metadata);
    }
  }

  warn(message: string, req?: NextApiRequest, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('WARN', message, req, metadata);
    this.logs.push(entry);
    
    console.warn(`[WARN] ${entry.timestamp} - ${message}`, metadata);
  }

  error(message: string, error?: Error, req?: NextApiRequest, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('ERROR', message, req, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: isProduction ? 'Internal server error' : error.message,
        stack: isProduction ? undefined : error.stack
      } : undefined
    });
    this.logs.push(entry);
    
    console.error(`[ERROR] ${entry.timestamp} - ${message}`, {
      error: error?.message,
      stack: isProduction ? undefined : error?.stack,
      ...metadata
    });
  }

  security(event: SecurityEvent, req?: NextApiRequest): void {
    const logEntry = this.createLogEntry('SECURITY', `Security event: ${event.type}`, req, {
      securityEvent: event
    });
    
    this.logs.push(logEntry);
    this.securityEvents.push({
      ...event,
      ip: req ? this.getClientIP(req) : event.ip,
      userAgent: req?.headers['user-agent'] || event.userAgent
    });

    console.warn(`[SECURITY] ${logEntry.timestamp} - ${event.type}: ${event.details}`, {
      severity: event.severity,
      ip: logEntry.ip,
      userAgent: logEntry.userAgent
    });

    // In production, you might want to send critical security events to external monitoring
    if (isProduction && event.severity === 'CRITICAL') {
      this.sendCriticalAlert(event, req);
    }
  }

  private sendCriticalAlert(event: SecurityEvent, req?: NextApiRequest): void {
    // Implementation for sending alerts to external services
    // e.g., Slack, email, monitoring service, etc.
    console.error(`[CRITICAL SECURITY ALERT] ${event.type}: ${event.details}`);
  }

  // Get logs for monitoring/debugging (filtered for production)
  getLogs(limit: number = 100): LogEntry[] {
    const recentLogs = this.logs.slice(-limit);
    
    if (isProduction) {
      // Filter sensitive information in production
      return recentLogs.map(log => ({
        ...log,
        metadata: log.metadata ? this.sanitizeMetadata(log.metadata) : undefined
      }));
    }
    
    return recentLogs;
  }

  getSecurityEvents(limit: number = 50): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  // Cleanup old logs to prevent memory leaks
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 hours default
    const cutoff = Date.now() - maxAge;
    this.logs = this.logs.filter(log => new Date(log.timestamp).getTime() > cutoff);
    this.securityEvents = this.securityEvents.filter(event => 
      // Assuming security events don't have timestamps, keep recent ones based on array position
      this.securityEvents.indexOf(event) >= this.securityEvents.length - 1000
    );
  }
}

// Error response utilities
export class ErrorHandler {
  
  static createSafeErrorResponse(error: Error, userMessage?: string): {
    message: string;
    code?: string;
    timestamp: string;
  } {
    const timestamp = new Date().toISOString();
    
    if (isProduction) {
      return {
        message: userMessage || 'An error occurred. Please try again.',
        timestamp
      };
    }
    
    return {
      message: error.message,
      code: error.name,
      timestamp
    };
  }

  static logAndRespond(
    error: Error,
    req: NextApiRequest,
    userMessage?: string,
    metadata?: Record<string, any>
  ) {
    const logger = Logger.getInstance();
    const errorId = crypto.randomBytes(8).toString('hex');
    
    logger.error(`Error ${errorId}: ${error.message}`, error, req, {
      ...metadata,
      errorId
    });
    
    return {
      ...this.createSafeErrorResponse(error, userMessage),
      ...(isProduction ? {} : { errorId })
    };
  }
}

// Intrusion detection patterns
export class IntrusionDetector {
  private static suspiciousPatterns = [
    // Only catch actual malicious SQL injection attempts, not legitimate SQL keywords
    /(\bunion\s+select|\bselect\s+.*\s+from\s+.*\s+where.*['"]\s*or\s+.*['"]\s*=\s*['"])/gi,
    // XSS patterns - more specific to avoid blocking legitimate script discussions
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:\s*[^a-zA-Z]/gi, // Only suspicious javascript: with non-alphabetic chars
    // Path traversal - only actual attempts
    /\.\.\/\.\.\/|\.\.\\\.\.\\|\.\.\%2f\.\.\%2f|\.\.\%5c\.\.\%5c/gi,
    // Command injection - only when combined with suspicious operators
    /(\||;|&|`|\$\()\s*(cmd|command|exec|system|shell|eval|rm\s+-rf|wget|curl)/gi,
    // Network tools only when used maliciously
    /\b(wget|curl|nc|netcat)\s+.*\s+(http|ftp|ssh)/gi
  ];

  private static readonly MAX_REQUESTS_PER_MINUTE = 60;
  private static readonly MAX_FAILED_ATTEMPTS = 10;
  
  private static requestCounts = new Map<string, { count: number; timestamp: number }>();
  private static failedAttempts = new Map<string, number>();

  static analyzeRequest(req: NextApiRequest, payload?: any): SecurityEvent[] {
    const events: SecurityEvent[] = [];
    const ip = this.getClientIP(req);
    const logger = Logger.getInstance();

    // Check for suspicious patterns in URL
    if (req.url && this.containsSuspiciousContent(req.url)) {
      events.push({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        details: 'Suspicious patterns detected in URL',
        ip,
        userAgent: req.headers['user-agent']
      });
    }

    // Check payload for suspicious content
    if (payload && typeof payload === 'object') {
      const payloadStr = JSON.stringify(payload);
      if (this.containsSuspiciousContent(payloadStr)) {
        events.push({
          type: 'MALICIOUS_INPUT',
          severity: 'HIGH',
          details: 'Suspicious patterns detected in request payload',
          ip,
          payload: isProduction ? '[REDACTED]' : payload
        });
      }
    }

    // Check request frequency
    const now = Date.now();
    const currentCount = this.requestCounts.get(ip);
    
    if (currentCount && now - currentCount.timestamp < 60000) { // Within 1 minute
      currentCount.count++;
      if (currentCount.count > this.MAX_REQUESTS_PER_MINUTE) {
        events.push({
          type: 'RATE_LIMIT_EXCEEDED',
          severity: 'MEDIUM',
          details: `Excessive requests: ${currentCount.count} requests in 1 minute`,
          ip
        });
      }
    } else {
      this.requestCounts.set(ip, { count: 1, timestamp: now });
    }

    // Log all security events
    events.forEach(event => logger.security(event, req));

    return events;
  }

  private static getClientIP(req: NextApiRequest): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.connection?.remoteAddress ||
      'unknown'
    );
  }

  private static containsSuspiciousContent(content: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(content));
  }

  static recordFailedAttempt(ip: string): void {
    const current = this.failedAttempts.get(ip) || 0;
    this.failedAttempts.set(ip, current + 1);
    
    if (current + 1 >= this.MAX_FAILED_ATTEMPTS) {
      const logger = Logger.getInstance();
      logger.security({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        details: `Multiple failed attempts: ${current + 1} failures`,
        ip
      });
    }
  }

  static isBlocked(ip: string): boolean {
    const attempts = this.failedAttempts.get(ip) || 0;
    return attempts >= this.MAX_FAILED_ATTEMPTS;
  }

  static cleanup(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Clean up old request counts
    this.requestCounts.forEach((value, key) => {
      if (now - value.timestamp > oneHour) {
        this.requestCounts.delete(key);
      }
    });
    
    // Reset failed attempts after 24 hours
    const twentyFourHours = 24 * 60 * 60 * 1000;
    this.failedAttempts.clear(); // Simple reset for now
  }
}

export const logger = Logger.getInstance();
export type { SecurityEvent, LogEntry };
