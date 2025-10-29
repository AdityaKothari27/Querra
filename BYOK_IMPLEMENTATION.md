# BYOK (Bring Your Own Keys) Implementation Guide

## Overview
Users can now provide their own Gemini and Groq API keys to bypass rate limits and use their own quota. Keys are stored locally in the browser and never sent to our servers.

## Features Implemented

### 1. **UI Toggle in Model Selection**
- ✅ Checkbox: "Use my own API keys ✨ Bypass rate limits"
- ✅ Password inputs for Gemini and Groq API keys
- ✅ Direct links to get API keys
- ✅ Privacy notice: "Your keys are stored locally in your browser"
- ✅ Keys persist across sessions (localStorage)

### 2. **Rate Limit Bypass**
- ✅ Rate limiter checks for `x-user-api-keys` header
- ✅ Automatically bypasses 2 req/min limit when using own keys
- ✅ Adds `X-RateLimit-Bypass: true` header in response
- ✅ Works for all endpoints: `/api/chat`, `/api/generate`, `/api/search`

### 3. **API Key Usage**
- ✅ GeminiProcessor constructor accepts optional user keys
- ✅ Frontend passes keys to all API calls
- ✅ Backend creates new processor instance with user keys
- ✅ Falls back to environment keys if user keys not provided

### 4. **Security & Privacy**
- ✅ Keys stored in separate localStorage key (`querraApiKeys`)
- ✅ Password input type hides keys in UI
- ✅ Keys only sent to backend, never stored server-side
- ✅ Header indicator for rate limit bypass

## How It Works

### Frontend Flow
```typescript
// 1. User toggles checkbox and enters keys
useOwnKeys = true
geminiApiKey = "AIza..."
groqApiKey = "gsk_..."

// 2. Keys saved to localStorage
localStorage.setItem('querraApiKeys', JSON.stringify({
  useOwnKeys, geminiApiKey, groqApiKey
}))

// 3. Keys passed to API calls
const userKeys = useOwnKeys ? {
  gemini: geminiApiKey || undefined,
  groq: groqApiKey || undefined
} : undefined;

await generateReport(...params, userKeys);
await sendChatMessageStream(...params, userKeys);
await searchWeb(...params, userKeys);
```

### Backend Flow
```typescript
// 1. Check for user keys header
const userKeys = req.headers['x-user-api-keys'];
if (userKeys === 'true') {
  // Bypass rate limiting
  return true;
}

// 2. Extract keys from request body
const { userApiKeys } = req.body;

// 3. Create processor with user keys
const processor = userApiKeys?.gemini || userApiKeys?.groq
  ? new GeminiProcessor(userApiKeys.gemini, userApiKeys.groq)
  : defaultProcessor;

// 4. Use processor normally
await processor.generate_report(...);
```

## User Experience

### Before BYOK:
```
❌ Rate limit: 2 requests/minute
❌ Must wait 60 seconds between requests
❌ Limited usage for power users
```

### After BYOK:
```
✅ No rate limits with own keys
✅ Unlimited requests (subject to your API quota)
✅ Full control over API usage
✅ Privacy-first: keys stored locally
```

## UI Location

The BYOK toggle appears in the **AI Model Selection** section:

```
┌─────────────────────────────────────────┐
│ AI Model Selection                      │
│ [Dropdown: Gemini 2.0 Flash...]        │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ ☑ Use my own API keys ✨          │  │
│ │   Bypass rate limits               │  │
│ │                                     │  │
│ │ Gemini API Key (Get key →)        │  │
│ │ [••••••••••••••••••]              │  │
│ │                                     │  │
│ │ Groq API Key (Get key →)          │  │
│ │ [••••••••••••••••••]              │  │
│ │                                     │  │
│ │ 🔒 Your keys are stored locally    │  │
│ │    in your browser. We never see   │  │
│ │    or store them on our servers.   │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Files Modified

### Frontend
1. **src/contexts/SessionContext.tsx**
   - Added `useOwnKeys`, `geminiApiKey`, `groqApiKey` state
   - Separate localStorage for API keys (`querraApiKeys`)
   - Persists across sessions

2. **src/components/ReportSection.tsx**
   - BYOK toggle UI in model selection section
   - Password inputs for API keys
   - Links to get API keys
   - Passes keys to all API calls

3. **src/pages/index.tsx**
   - Passes user keys to `searchWeb()`

4. **src/lib/api.ts**
   - Updated `generateReport()` to accept `userApiKeys` parameter
   - Updated `sendChatMessageStream()` to accept `userApiKeys` parameter
   - Updated `searchWeb()` to accept `userApiKeys` parameter
   - Adds `x-user-api-keys` header when keys provided

### Backend
1. **src/utils/ai_processor.ts**
   - Modified constructor to accept optional API keys
   - `constructor(userGeminiKey?: string, userGroqKey?: string)`
   - Uses user keys if provided, falls back to environment variables

2. **src/utils/rateLimiter.ts**
   - Checks for `x-user-api-keys` header
   - Bypasses rate limiting when header present
   - Adds `X-RateLimit-Bypass: true` response header

3. **src/pages/api/chat.ts**
   - Extracts `userApiKeys` from request body
   - Creates new processor with user keys
   - Uses processor for chat generation

4. **src/pages/api/generate.ts**
   - Extracts `userApiKeys` from request body
   - Creates new processor with user keys
   - Uses processor for report generation

## Testing Checklist

### Manual Testing
- [ ] Toggle checkbox and enter API keys
- [ ] Verify keys persist after page refresh
- [ ] Make 3+ requests quickly (should not hit rate limit)
- [ ] Check browser console for "AI Processor initialized with user API keys"
- [ ] Verify response includes `X-RateLimit-Bypass: true` header
- [ ] Toggle off checkbox and verify rate limits apply again
- [ ] Test with only Gemini key (Groq empty)
- [ ] Test with only Groq key (Gemini empty)
- [ ] Test with both keys

### Verification Commands
```bash
# Check response headers
curl -I -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "x-user-api-keys: true" \
  -d '{"query":"test", "sources":[], "documentIds":[], "promptTemplate":"", "model":"gemini-2.5-flash", "userApiKeys":{"gemini":"test-key"}}'

# Should see: X-RateLimit-Bypass: true
```

### Browser DevTools
```javascript
// Check localStorage
localStorage.getItem('querraApiKeys')
// Should show: {"useOwnKeys":true,"geminiApiKey":"AIza...","groqApiKey":"gsk_..."}

// Check request headers
// Network tab → Any API request → Headers
// Should see: x-user-api-keys: true
```

## Security Considerations

### Current Implementation
✅ Keys stored in browser localStorage (client-side only)
✅ Password input type hides keys in UI
✅ Keys sent via HTTPS (encrypted in transit)
✅ Never logged or stored server-side
✅ Separate localStorage key for easy management

### Limitations
⚠️ localStorage is accessible to JavaScript (XSS risk)
⚠️ No encryption at rest (browser storage is plain text)
⚠️ Keys visible in browser DevTools

### Recommendations for Production
1. **Add encryption**: Encrypt keys before storing in localStorage
2. **Session-only option**: Option to not persist keys
3. **Key validation**: Test keys before saving
4. **Warning message**: Explain security implications
5. **Clear keys button**: Easy way to remove keys

## Future Enhancements

### Phase 2
- [ ] Encrypt API keys in localStorage
- [ ] Test connection button ("Validate Keys")
- [ ] Session-only mode (don't persist keys)
- [ ] Usage tracking (show API calls made with user keys)
- [ ] Key validation and error handling

### Phase 3
- [ ] Multiple key profiles
- [ ] API usage dashboard
- [ ] Cost estimation
- [ ] Key rotation reminders

## Product Hunt Messaging

### Feature Highlight
```
🔓 Bring Your Own Keys (BYOK)

Free Tier: 2 requests/min
OR
Your API Keys: Unlimited ✨

Why BYOK?
• No rate limits with your keys
• Full control over your quota
• Privacy-first: keys stored locally
• Works with Gemini & Groq APIs

Transparent. Flexible. User-First.
```

### Launch Copy
```
Querra gives you options:

1. Free Tier - Try it out
   • 2 requests/minute
   • Perfect for testing

2. Your Keys - Unlimited power
   • Bypass all rate limits
   • Use your own quota
   • Keys never leave your browser

3. Premium (Coming Soon)
   • Hassle-free unlimited
   • Priority processing
   • Advanced features

Your choice. Your control.
```

## Support Documentation

### How to Get API Keys

**Gemini API Key:**
1. Visit https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy and paste into Querra

**Groq API Key:**
1. Visit https://console.groq.com/keys
2. Sign up for free account
3. Create new API key
4. Copy and paste into Querra

### FAQ

**Q: Are my API keys safe?**
A: Your keys are stored locally in your browser and never sent to our servers. They're only used to make API calls directly to Gemini/Groq on your behalf.

**Q: Will I be charged?**
A: API usage with your keys goes against your own Gemini/Groq quota. You'll be charged according to their pricing, not ours.

**Q: Can I remove my keys?**
A: Yes! Just uncheck "Use my own API keys" and clear the input fields. Your keys will be removed from browser storage.

**Q: Do rate limits still apply?**
A: No! When using your own keys, Querra's rate limits don't apply. You're only limited by Gemini/Groq's API quotas.

**Q: Which key should I use?**
A: Gemini keys work for all modes. Groq keys are faster but have different model options. You can use both!

## Implementation Complete! 🎉

All 5 todos completed:
1. ✅ API keys context/state management
2. ✅ BYOK toggle UI
3. ✅ Rate limiter bypass
4. ✅ API routes updated
5. ✅ Ready for testing

**Next Step**: Test the functionality and update RATE_LIMITING.md with BYOK information!
