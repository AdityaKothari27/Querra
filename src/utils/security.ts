import crypto from 'crypto';
import { NextApiRequest } from 'next';

// File validation constants
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_REQUEST_SIZE = 50 * 1024 * 1024; // 50MB

// Malicious patterns to check for (more lenient for legitimate coding discussions)
const MALICIOUS_PATTERNS = [
  /<script[^>]*>\s*(alert|confirm|prompt|document\.cookie|window\.location)/gi, // Only suspicious script content
  /javascript:\s*[^a-zA-Z0-9\s]/gi, // Only suspicious javascript: usage
  /on\w+\s*=\s*[^a-zA-Z0-9\s]/gi, // Only suspicious event handlers
  /<iframe[^>]*src\s*=\s*["']?(?:data:|javascript:|about:)/gi, // Only malicious iframes
  /<object[^>]*data\s*=\s*["']?(?:data:|javascript:)/gi, // Only malicious objects
  /data:text\/html.*<script/gi // Only HTML data URLs with scripts
];

const SQL_INJECTION_PATTERNS = [
  // Only catch actual SQL injection attempts, not legitimate SQL discussions
  /(\bunion\s+select.*from.*where.*or.*=|select.*from.*where.*['"]\s*or\s+.*['"]\s*=\s*['"])/gi,
  /(insert.*into.*values.*['"]\s*;\s*drop|delete.*from.*where.*['"]\s*or\s+.*['"]\s*=\s*['"])/gi,
  // Remove overly broad patterns that block code discussions
];

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
}

export class SecurityValidator {
  
  /**
   * Validate file upload security
   */
  static validateFile(file: any, buffer: Buffer): SecurityValidationResult {
    const errors: string[] = [];

    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check file type
    if (file.mimetype && !ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check for suspicious file extensions
    const filename = file.originalFilename || file.name || '';
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.jar', '.js', '.vbs'];
    if (suspiciousExtensions.some(ext => filename.toLowerCase().endsWith(ext))) {
      errors.push('Suspicious file extension detected');
    }

    // Basic malware scan (check for suspicious patterns in content)
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024)); // Check first 1KB
    if (this.containsMaliciousPatterns(content)) {
      errors.push('Potentially malicious content detected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize filename to prevent path traversal
   */
  static sanitizeFilename(filename: string): string {
    if (!filename) return `file_${Date.now()}`;
    
    // Remove path traversal attempts
    let sanitized = filename.replace(/[\/\\\.\.]/g, '');
    
    // Remove special characters that could be problematic
    sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '');
    
    // Limit length
    sanitized = sanitized.substring(0, 100);
    
    // Ensure it's not empty and has valid characters
    if (!sanitized || !/^[a-zA-Z0-9._-]+$/.test(sanitized)) {
      sanitized = `file_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    return sanitized;
  }

  /**
   * Validate and sanitize user input (minimal validation for chat contexts)
   */
  static validateInput(input: string, maxLength: number = 10000, enableMaliciousChecks: boolean = false): SecurityValidationResult {
    const errors: string[] = [];
    
    if (!input || typeof input !== 'string') {
      return { isValid: false, errors: ['Invalid input type'] };
    }

    // Check length
    if (input.length > maxLength) {
      errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    }

    // Only perform malicious pattern checking if explicitly enabled (disabled for chat)
    if (enableMaliciousChecks) {
      // Only flag extremely obvious malicious attempts
      const suspiciousScripts = /<script[^>]*>[\s\S]*?document\.cookie|window\.location[\s\S]*?<\/script>/gi;
      const dangerousSQL = /;\s*(drop|delete|truncate)\s+(table|database)/gi;
      
      if (suspiciousScripts.test(input)) {
        errors.push('Suspicious script detected');
      }
      
      if (dangerousSQL.test(input)) {
        errors.push('Dangerous SQL command detected');
      }
    }

    // Minimal sanitization - only remove null bytes
    const sanitized = this.sanitizeInput(input, enableMaliciousChecks);

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Check for malicious patterns
   */
  private static containsMaliciousPatterns(input: string): boolean {
    return MALICIOUS_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Check for SQL injection patterns
   */
  private static containsSQLInjection(input: string): boolean {
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize input with minimal changes for legitimate content
   */
  private static sanitizeInput(input: string, enableHtmlEscaping: boolean = false): string {
    // Remove null bytes and other control characters
    let sanitized = input.replace(/[\0\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Only escape HTML when explicitly enabled and when it appears malicious
    if (enableHtmlEscaping && /(<script|<iframe|<object|javascript:|data:text\/html)/gi.test(sanitized)) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }
    
    return sanitized;
  }

  /**
   * Validate request size
   */
  static validateRequestSize(req: NextApiRequest): SecurityValidationResult {
    const contentLength = req.headers['content-length'];
    
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return {
        isValid: false,
        errors: [`Request size exceeds maximum allowed size of ${MAX_REQUEST_SIZE / 1024 / 1024}MB`]
      };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Generate secure session token
   */
  static generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash sensitive data
   */
  static hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class RateLimiter {
  private static readonly DEFAULT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private static readonly DEFAULT_MAX_REQUESTS = 100;

  static checkRateLimit(
    identifier: string, 
    maxRequests: number = this.DEFAULT_MAX_REQUESTS,
    windowMs: number = this.DEFAULT_WINDOW
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;
    
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      // Reset or create new record
      const resetTime = now + windowMs;
      rateLimitStore.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: maxRequests - 1, resetTime };
    }
    
    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }
    
    record.count++;
    rateLimitStore.set(key, record);
    
    return { 
      allowed: true, 
      remaining: maxRequests - record.count, 
      resetTime: record.resetTime 
    };
  }

  static cleanup(): void {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    });
  }
}

export default SecurityValidator;
