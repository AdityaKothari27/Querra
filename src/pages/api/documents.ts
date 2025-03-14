import type { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../utils/database';
import fs from 'fs';

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
  } else if (req.method === 'DELETE') {
    try {
      const id = Number(req.query.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }
      
      // Get document path before deleting
      const document = await db.get_document_by_id(id);
      if (document && document.path) {
        // Delete file from filesystem
        try {
          fs.unlinkSync(document.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
      
      // Delete from database
      await db.delete_document(id);
      res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to delete document' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 