import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { Database } from '../../utils/database';
import { PdfExtractor } from '../../utils/pdf_extractor';

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
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: (part) => part.mimetype?.includes('pdf') || false,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files];
    
    // Process each uploaded file
    for (const file of uploadedFiles) {
      if (!file) continue;
      
      const filePath = file.filepath;
      const fileName = file.originalFilename || path.basename(filePath);
      
      // Extract text from PDF
      const content = await pdfExtractor.extract(filePath);
      
      // Save to database
      await db.save_document(fileName, filePath, content);
    }

    res.status(200).json({ message: 'Files uploaded successfully' });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload files' });
  }
} 