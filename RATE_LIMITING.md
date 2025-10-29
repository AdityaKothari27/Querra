# Rate Limiting & Input Validation

## Overview
This document describes the rate limiting and input validation measures implemented in Querra to protect against API abuse and manage free-tier API quota.

## Rate Limiting

### Configuration
- **Limit**: 2 requests per minute per IP address
- **Applies to**: All API endpoints (`/api/chat`, `/api/generate`, `/api/search`)
- **Implementation**: Custom middleware in `src/utils/rateLimiter.ts`

### How It Works
1. Tracks requests by IP address + endpoint
2. Maintains in-memory store of request counts and reset times
3. Returns HTTP 429 (Too Many Requests) when limit exceeded
4. Provides `Retry-After` header indicating when to retry
5. Includes rate limit headers in all responses:
   - `X-RateLimit-Limit`: Maximum requests allowed
   - `X-RateLimit-Remaining`: Requests remaining in current window
   - `X-RateLimit-Reset`: When the rate limit resets

### Response Example
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in 45 seconds.",
  "retryAfter": 45
}
```

## Character Limits

### Input Restrictions
- **Prompt Template**: 2000 characters max
- **Chat Messages**: 2000 characters max

### Features
- Real-time character counter display
- Visual warning at 1900 characters
- Hard limit at 2000 characters (enforced by `maxLength` attribute)
- Warning messages when approaching or at limit

### User Experience
- Character count shown as: "X/2000 characters"
- Orange warning appears at 1900+ characters
- Error message at 2000: "⚠️ Character limit reached"

## Frontend Error Handling

### Rate Limit Errors
The frontend (`src/lib/api.ts`) now detects rate limit errors and displays user-friendly messages:

```typescript
if (response.status === 429) {
  const data = await response.json();
  throw new Error(data.message || 'Rate limit exceeded. Please wait before trying again.');
}
```

### User Notifications
- Toast notifications display rate limit messages
- Shows wait time when available
- Prevents form submission when rate limited

## API Routes Protected

### 1. `/api/chat` (Chat Streaming)
- Rate limit: 2 requests/minute per IP
- Also has existing security middleware with 30 req/15min limit
- Double-layered protection

### 2. `/api/generate` (Report Generation)
- Rate limit: 2 requests/minute per IP
- Also has existing security with 20 req/15min limit
- Protects expensive AI operations

### 3. `/api/search` (Web Search)
- Rate limit: 2 requests/minute per IP
- Prevents search API quota exhaustion

## BYOK (Bring Your Own Keys) - Rate Limit Bypass

### Overview
Users can provide their own Gemini and Groq API keys to bypass rate limits entirely.

### How to Use
1. In the AI Model Selection section, check **"Use my own API keys"**
2. Enter your Gemini API key (get from https://aistudio.google.com/app/apikey)
3. Enter your Groq API key (get from https://console.groq.com/keys)
4. Keys are stored locally in your browser
5. Rate limits no longer apply! ✨

### Technical Details
- Keys stored in localStorage (`querraApiKeys`)
- Frontend sends `x-user-api-keys: true` header
- Backend bypasses rate limiting when header detected
- API calls use user's keys instead of server keys
- Response includes `X-RateLimit-Bypass: true` header

### Benefits
✅ **Unlimited requests** - No rate limits with your keys
✅ **Privacy-first** - Keys never stored on our servers
✅ **Full control** - Use your own API quota
✅ **Transparent** - You know exactly what's being used

See [BYOK_IMPLEMENTATION.md](./BYOK_IMPLEMENTATION.md) for full details.

---

## Benefits

### Cost Management
✅ Prevents uncontrolled API usage on free tiers
✅ Protects against accidental quota exhaustion
✅ Limits token consumption per user
✅ BYOK option for power users who want unlimited access

### Security
✅ Prevents DDoS attacks
✅ Mitigates brute force attempts
✅ Reduces spam and abuse
✅ IP-based tracking for accountability
✅ BYOK users bypass without compromising security

### User Experience
✅ Clear feedback on limits
✅ Character counters prevent submission errors
✅ Helpful error messages with retry information
✅ Smooth degradation under load
✅ Optional unlimited access via BYOK

## Production Considerations

### Current Implementation (In-Memory)
- ✅ Simple, no dependencies
- ✅ Fast performance
- ⚠️ Not shared across multiple server instances
- ⚠️ Resets on server restart

### Scaling Recommendations
For production deployment with multiple instances:
1. **Use Redis** for distributed rate limiting
2. **Implement sliding window** for more precise limits
3. **Add user authentication** for per-user limits (not just IP)
4. **Monitor metrics** to adjust limits based on usage patterns

### Redis Implementation Example
```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Store rate limit data in Redis instead of memory
await redis.incr(`rate_limit:${key}`);
await redis.expire(`rate_limit:${key}`, windowSeconds);
```

## Testing

### Manual Testing
1. Make 2 requests to any API endpoint quickly
2. Third request within 60 seconds should return 429
3. Wait 60 seconds, requests should work again
4. Character counters should update in real-time
5. Cannot type beyond 2000 characters

### Monitoring
Check response headers to track rate limits:
```bash
curl -I http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

Look for:
- `X-RateLimit-Limit: 2`
- `X-RateLimit-Remaining: 1`
- `X-RateLimit-Reset: 2025-10-28T...`

## Configuration Changes

To adjust rate limits, modify the configuration in API route files:

```typescript
export default withRateLimit(handler, { 
  maxRequests: 2,    // Change this
  windowMs: 60 * 1000 // Or this (in milliseconds)
});
```

To adjust character limits, modify in `ReportSection.tsx`:
```typescript
maxLength={2000} // Change this value
```

## Related Files
- `src/utils/rateLimiter.ts` - Rate limiting middleware
- `src/pages/api/chat.ts` - Chat endpoint with rate limiting
- `src/pages/api/generate.ts` - Generate endpoint with rate limiting
- `src/pages/api/search.ts` - Search endpoint with rate limiting
- `src/lib/api.ts` - Frontend API client with rate limit error handling
- `src/components/ReportSection.tsx` - Input fields with character limits
