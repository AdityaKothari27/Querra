export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchConfig {
  maxResults: number;
  timeFilter: string;
}

export interface Report {
  id: number;
  query: string;
  content: string;
  sources: string[];
  created_at: string;
} 