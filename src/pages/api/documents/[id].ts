import type { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../utils/database';
import { withSecurity } from '../../../utils/middleware';

const db = new Database();

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  
  // Validate document ID
  const documentId = Number(id);
  if (isNaN(documentId) || documentId < 1) {
    return res.status(400).json({ message: 'Invalid document ID' });
  }

  // Fetch document by ID
  const document = await db.get_document_by_id(documentId);
  
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  res.status(200).json(document);
}

export default withSecurity(handler, {
  rateLimit: {
    maxRequests: 60,
    windowMs: 15 * 60 * 1000 // 15 minutes
  },
  validateInput: true,
  logRequests: true
});
