import type { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../utils/database';

const db = new Database();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const documents = await db.get_documents();
      res.status(200).json(documents);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get documents' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, content } = req.body;
      
      if (!name || !content) {
        return res.status(400).json({ message: 'Name and content are required' });
      }
      
      // Save document with content directly (no file path needed)
      const id = await db.save_document(name, name, content);
      
      res.status(201).json({ 
        id,
        name,
        message: 'Document saved successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to save document' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 