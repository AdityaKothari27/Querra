import type { NextApiRequest, NextApiResponse } from 'next';
import ApplicationStartup from '../../utils/startup';
import { withSecurity } from '../../utils/middleware';
import { logger } from '../../utils/logging';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const healthCheck = await ApplicationStartup.healthCheck();
    
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;

    logger.info('Health check performed', req, { 
      status: healthCheck.status,
      checksCount: Object.keys(healthCheck.checks).length 
    });

    res.status(statusCode).json({
      status: healthCheck.status,
      timestamp: new Date().toISOString(),
      checks: healthCheck.checks
    });
  } catch (error) {
    logger.error('Health check failed', error as Error, req);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      message: 'Health check failed'
    });
  }
}

export default withSecurity(handler, {
  rateLimit: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 requests per minute
  logRequests: false // Don't log health checks to reduce noise
});
