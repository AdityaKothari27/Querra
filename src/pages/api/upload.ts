import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { Database } from '../../utils/database';
import path from 'path';

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const db = new Database();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let fileContent = '';
    
    // In serverless environment, the file is already in memory
    if (isServerless) {
      // Read file from the formidable file object
      if (file.mimetype?.includes('text')) {
        // For text files
        const buffer = await fs.promises.readFile(file.filepath);
        fileContent = buffer.toString();
      } else {
        // For binary files - simplified here, would need proper handling
        fileContent = "Binary file content";
      }
    } else {
      // In local environment, read from disk
      fileContent = await fs.promises.readFile(file.filepath, 'utf8');
    }

    // Get the original filename
    const originalFilename = file.originalFilename || 'document';
    
    // Store in database
    const documentId = await db.save_document(
      originalFilename,
      file.filepath,
      fileContent
    );

    // Clean up temporary file
    try {
      if (!isServerless && fs.existsSync(file.filepath)) {
        await fs.promises.unlink(file.filepath);
      }
    } catch (e) {
      console.error("Error removing temp file:", e);
    }

    res.status(200).json({ 
      message: 'File uploaded successfully', 
      documentId,
      name: originalFilename
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload file' });
  }
} 