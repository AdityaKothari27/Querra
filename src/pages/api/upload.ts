import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { Database } from '../../utils/database';
import path from 'path';
import { PdfExtractor } from '../../utils/pdf_extractor';
import { SecurityValidator, RateLimiter } from '../../utils/security';
import { logger, ErrorHandler, IntrusionDetector } from '../../utils/logging';

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb',
  },
};

const db = new Database();
const pdfExtractor = new PdfExtractor();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Security checks
    const requestSizeValidation = SecurityValidator.validateRequestSize(req);
    if (!requestSizeValidation.isValid) {
      logger.security({
        type: 'FILE_UPLOAD_BLOCKED',
        severity: 'MEDIUM',
        details: `Request size validation failed: ${requestSizeValidation.errors.join(', ')}`
      }, req);
      return res.status(413).json({ message: 'Request too large' });
    }

    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] as string || 
                    req.headers['x-real-ip'] as string || 
                    req.connection?.remoteAddress || 'unknown';
    
    const rateLimit = RateLimiter.checkRateLimit(clientIP, 10, 15 * 60 * 1000); // 10 uploads per 15 min
    if (!rateLimit.allowed) {
      logger.security({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        details: `Upload rate limit exceeded for IP: ${clientIP}`
      }, req);
      return res.status(429).json({ 
        message: 'Too many upload attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      });
    }

    // Intrusion detection
    const securityEvents = IntrusionDetector.analyzeRequest(req);
    if (securityEvents.some(event => event.severity === 'CRITICAL')) {
      return res.status(403).json({ message: 'Request blocked for security reasons' });
    }

    logger.info('File upload request received', req, { 
      ip: clientIP,
      remaining: rateLimit.remaining 
    });
    const isServerless = process.env.VERCEL_ENV !== undefined;
    
    const form = formidable({
      // Configuration for serverless or local environment
      fileWriteStreamHandler: isServerless ? () => {
        // For serverless, just create a passthrough stream that doesn't write to disk
        const { PassThrough } = require('stream');
        return new PassThrough();
      } : undefined,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filter: ({ mimetype }) => {
        // Additional MIME type validation
        const allowedTypes = [
          'application/pdf',
          'text/plain',
          'text/csv',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        return mimetype ? allowedTypes.includes(mimetype) : false;
      }
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file) {
      logger.warn('File upload attempted without file', req);
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read file content for security validation
    let fileBuffer: Buffer;
    if (isServerless && file.size && file.size > 0) {
      // In serverless, read from filepath or buffer
      fileBuffer = fs.readFileSync(file.filepath);
    } else if (file.filepath) {
      fileBuffer = fs.readFileSync(file.filepath);
    } else {
      logger.error('Unable to read uploaded file', undefined, req);
      return res.status(400).json({ message: 'Invalid file upload' });
    }

    // Security validation
    const fileValidation = SecurityValidator.validateFile(file, fileBuffer);
    if (!fileValidation.isValid) {
      logger.security({
        type: 'FILE_UPLOAD_BLOCKED',
        severity: 'HIGH',
        details: `File validation failed: ${fileValidation.errors.join(', ')}`
      }, req);
      return res.status(400).json({ 
        message: 'File upload blocked for security reasons',
        errors: fileValidation.errors 
      });
    }

    // Sanitize filename
    const originalName = file.originalFilename || file.newFilename || 'unknown';
    const sanitizedName = SecurityValidator.sanitizeFilename(originalName);
    
    logger.info('File validation passed', req, { 
      originalName, 
      sanitizedName, 
      size: file.size,
      mimetype: file.mimetype 
    });

    let fileContent = '';
    
    // In serverless environment, the file is already in memory
    if (isServerless) {
      // Read file from the formidable file object
      if (file.mimetype?.includes('text')) {
        // For text files
        fileContent = fileBuffer.toString('utf8');
      } else if (file.mimetype === 'application/pdf') {
        // For PDF files, extract text content
        fileContent = await pdfExtractor.extractFromBuffer(fileBuffer);
      } else {
        // For other supported document types
        fileContent = fileBuffer.toString('utf8');
      }
    } else {
      // In local environment, read from disk
      if (file.mimetype === 'application/pdf') {
        fileContent = await pdfExtractor.extract(file.filepath);
      } else {
        fileContent = await fs.promises.readFile(file.filepath, 'utf8');
      }
    }

    // Validate extracted content
    const contentValidation = SecurityValidator.validateInput(fileContent, 100000); // 100KB text limit
    if (!contentValidation.isValid) {
      logger.security({
        type: 'MALICIOUS_INPUT',
        severity: 'HIGH',
        details: `File content validation failed: ${contentValidation.errors.join(', ')}`
      }, req);
      return res.status(400).json({ 
        message: 'File content blocked for security reasons' 
      });
    }

    // Store in database with sanitized filename
    const documentId = await db.save_document(
      sanitizedName,
      file.filepath,
      contentValidation.sanitized || fileContent
    );

    logger.info('File uploaded successfully', req, { 
      documentId, 
      filename: sanitizedName,
      contentLength: fileContent.length 
    });

    // Clean up temporary file
    try {
      if (!isServerless && fs.existsSync(file.filepath)) {
        await fs.promises.unlink(file.filepath);
      }
    } catch (e) {
      logger.error('Error removing temp file', e as Error, req);
    }

    res.status(200).json({ 
      message: 'File uploaded successfully', 
      documentId,
      name: sanitizedName
    });
  } catch (error: any) {
    const errorResponse = ErrorHandler.logAndRespond(
      error,
      req,
      'Failed to upload file. Please try again.',
      { fileSize: req.headers['content-length'] }
    );
    res.status(500).json(errorResponse);
  }
} 