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