import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleSearch } from '../../utils/search';

const searchEngine = new GoogleSearch();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query, maxResults, timeFilter } = req.body;
    const results = await searchEngine.search(query, maxResults, timeFilter);
    res.status(200).json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 