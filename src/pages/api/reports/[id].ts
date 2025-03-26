import type { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../utils/database';

const db = new Database();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid report ID' });
  }
  
  const reportId = parseInt(id, 10);
  
  if (isNaN(reportId)) {
    return res.status(400).json({ message: 'Invalid report ID format' });
  }

  try {
    if (req.method === 'DELETE') {
      // Delete the report
      await db.delete_report(reportId);
      return res.status(200).json({ message: 'Report deleted successfully' });
    } else if (req.method === 'GET') {
      // For GET requests, return the report (if needed)
      const reports = await db.get_reports();
      const report = reports.find((r: any) => r.id === reportId);
      
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      return res.status(200).json(report);
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error handling report:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
} 