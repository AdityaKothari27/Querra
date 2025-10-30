export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface Report {
  id: number;
  query: string;
  content: string;
  sources: string[];
  created_at: string;
}

export interface SearchConfig {
  maxResults: number;
  timeFilter: string;
  category?: string;
  excludedDomains?: string[];
  page?: number;
  generationMode?: 'traditional' | 'fast' | 'chat';
  model?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'gemini' | 'groq' | 'openrouter';
  description: string;
}

export interface GenerationMode {
  type: 'traditional' | 'fast' | 'chat';
  label: string;
  description: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
}

export interface CategoryConfig {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  defaultPrompt?: string;
  searchInstructions?: string;
  color: string;
}

export interface Document {
  id: number;
  name: string;
  path: string;
  created_at: string;
}