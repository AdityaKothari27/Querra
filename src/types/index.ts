export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface Report {
  id: number;
  title: string;
  query: string;
  content: string;
  date: string;
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