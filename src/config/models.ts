import { AIModel } from '../types/index';

export const AI_MODELS: AIModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Default)',
    provider: 'gemini',
    description: 'Fast and efficient model with URL context support'
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    provider: 'gemini',
    description: 'More advanced reasoning and analysis capabilities'
  },
  {
    id: 'moonshotai/kimi-k2-instruct',
    name: 'Kimi K2 Instruct',
    provider: 'groq',
    description: 'Fast inference model via Groq API'
  },
  {
    id: 'minimax/minimax-m2:free',
    name: 'Minimax M2 (Free)',
    provider: 'openrouter',
    description: 'Fast model via OpenRouter - free tier'
  }
];

export const getModelsByMode = (mode: 'traditional' | 'fast' | 'chat', hasUrls: boolean = true) => {
  if (mode === 'chat') {
    if (hasUrls) {
      // For chat with URLs, support all models
      return AI_MODELS;
    } else {
      // For chat without URLs, support Gemini 3 Flash Preview, Kimi, and Minimax
      return AI_MODELS.filter(model => 
        model.id === 'gemini-3-flash-preview' || 
        model.id === 'moonshotai/kimi-k2-instruct' ||
        model.id === 'minimax/minimax-m2:free'
      );
    }
  } else if (mode === 'traditional') {
    // For traditional mode (Quick Analysis), support Gemini default, Kimi, and Minimax
    return AI_MODELS.filter(model => 
      model.id === 'gemini-2.5-flash' || 
      model.id === 'moonshotai/kimi-k2-instruct' ||
      model.id === 'minimax/minimax-m2:free'
    );
  } else {
    // For fast mode (Deep Analysis), use default Gemini with URL context
    return AI_MODELS.filter(model => model.id === 'gemini-2.5-flash');
  }
};

export const getDefaultModel = (mode: 'traditional' | 'fast' | 'chat', hasUrls: boolean = true): string => {
  if (mode === 'chat' && !hasUrls) {
    return 'gemini-3-flash-preview'; // Default for chat without URLs
  }
  return 'gemini-2.5-flash'; // Default for all other cases
};
