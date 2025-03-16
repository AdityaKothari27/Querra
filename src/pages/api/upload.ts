import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { PdfExtractor } from '../../utils/pdf_extractor';
import { Database } from '../../utils/database';

export const config = {
  api: {
    bodyParser: false,
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
    // Use in-memory processing instead of file system
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: (part) => part.mimetype?.includes('pdf') || false,
      // Don't write to disk
      fileWriteStreamHandler: () => {
        throw new Error('File writing not supported in serverless environment');
      },
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files];
    
    // Process each uploaded file in memory
    for (const file of uploadedFiles) {
      if (!file) continue;
      
      const fileName = file.originalFilename || 'unnamed.pdf';
      
      // Extract text directly from the file buffer
      const content = await pdfExtractor.extractFromBuffer(file.filepath);
      
      // Store only the content and filename, not the path
      await db.save_document(fileName, fileName, content);
    }

    res.status(200).json({ message: 'Files uploaded successfully' });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload files' });
  }
} 