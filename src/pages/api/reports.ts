import type { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../utils/database';

const db = new Database();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const reports = await db.get_reports();
    return res.status(200).json(reports);
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 