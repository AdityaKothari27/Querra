import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleSearch } from '../../utils/search';
import { withRateLimit } from '../../utils/rateLimiter';

const searchClient = new GoogleSearch();

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query, maxResults, timeFilter, category, excludedDomains } = req.body;
    
    // Use the category to potentially modify the search query
    let enhancedQuery = query;
    if (category && category !== 'general') {
      enhancedQuery = `${query} ${category}`;
    }
    
    const results = await searchClient.search(
      enhancedQuery, 
      maxResults, 
      timeFilter, 
      excludedDomains || []
    );
    
    res.status(200).json(results);
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ 
      message: error.message || 'Internal server error',
      results: [] 
    });
  }
}

export default withRateLimit(handler, { maxRequests: 2, windowMs: 60 * 1000 }); // 2 requests per minute per IP 