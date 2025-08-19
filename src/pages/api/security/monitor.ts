import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../../utils/logging';
import { withSecurity } from '../../../utils/middleware';
import type { LogEntry, SecurityEvent } from '../../../utils/logging';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Only allow in development or with admin access (add auth later)
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { type, limit } = req.query;
    const logLimit = parseInt(limit as string) || 50;

    let data;

    switch (type) {
      case 'logs':
        data = logger.getLogs(logLimit);
        break;
      case 'security':
        data = logger.getSecurityEvents(logLimit);
        break;
      case 'summary':
        const logs = logger.getLogs(100);
        const securityEvents = logger.getSecurityEvents(50);
        
        data = {
          totalLogs: logs.length,
          totalSecurityEvents: securityEvents.length,
          criticalEvents: securityEvents.filter((e: SecurityEvent) => e.severity === 'CRITICAL').length,
          highRiskEvents: securityEvents.filter((e: SecurityEvent) => e.severity === 'HIGH').length,
          recentErrors: logs.filter((l: LogEntry) => l.level === 'ERROR').slice(-10),
          topIPs: getTopIPs(logs),
          eventTypes: getEventTypeCounts(securityEvents),
          timeline: getEventTimeline(securityEvents)
        };
        break;
      default:
        return res.status(400).json({ message: 'Invalid type parameter' });
    }

    res.status(200).json(data);
  } catch (error) {
    logger.error('Security monitoring error', error as Error, req);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function getTopIPs(logs: LogEntry[]): Array<{ ip: string; count: number }> {
  const ipCounts = logs.reduce((acc, log) => {
    if (log.ip) {
      acc[log.ip] = (acc[log.ip] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getEventTypeCounts(events: SecurityEvent[]): Array<{ type: string; count: number }> {
  const typeCounts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count: count as number }))
    .sort((a, b) => b.count - a.count);
}

function getEventTimeline(events: SecurityEvent[]): Array<{ hour: string; count: number }> {
  const now = new Date();
  const timeline = [];

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourStr = hour.toISOString().slice(0, 13);
    
    const count = events.filter(event => {
      // Since we don't have timestamps on security events, this is approximate
      return true; // Would need to add timestamps to security events
    }).length;

    timeline.push({
      hour: hourStr,
      count: Math.floor(count / 24) // Distribute evenly for demo
    });
  }

  return timeline;
}

export default withSecurity(handler, {
  rateLimit: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 requests per minute
  logRequests: true
});
