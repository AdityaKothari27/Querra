import type { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../utils/database';

const db = new Database();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const reports = await db.get_reports();
      res.status(200).json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get reports' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 