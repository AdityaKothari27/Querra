import type { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../utils/database';

const db = new Database();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the search query
  const { query } = req.query;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const reports = await db.search_reports(query);
    return res.status(200).json(reports);
  } catch (error: any) {
    console.error('Error searching reports:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
} 