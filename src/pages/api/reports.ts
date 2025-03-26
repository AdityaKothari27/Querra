import type { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../utils/database';

const db = new Database();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // Get all reports
      const reports = await db.get_reports();
      return res.status(200).json(reports);
    } else if (req.method === 'POST') {
      // Create a new report
      const { query, content, sources } = req.body;
      
      if (!query || !content || !sources) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      await db.save_report(query, content, sources);
      return res.status(201).json({ message: 'Report created successfully' });
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error handling reports:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}