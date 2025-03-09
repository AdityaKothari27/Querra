import axios from 'axios';
import { SearchResult, Report, SearchConfig } from '../types/index';

const api = axios.create({
  baseURL: '/api'
});

export const searchWeb = async (
  query: string,
  config: SearchConfig
): Promise<SearchResult[]> => {
  try {
    const response = await api.post('/search', {
      query,
      maxResults: config.maxResults,
      timeFilter: config.timeFilter,
      category: config.category
    });
    return response.data;
  } catch (error) {
    console.error('Search API error:', error);
    throw new Error('Failed to search. Please try again.');
  }
};

export const searchTopics = async (
  query: string,
  config: SearchConfig
): Promise<SearchResult[]> => {
  const response = await api.post('/search', { query, ...config });
  return response.data;
};

export const generateReport = async (
  query: string,
  sources: string[],
  promptTemplate: string
) => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, sources, promptTemplate }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate report');
  }

  return response.json();
};

export const getReports = async (): Promise<Report[]> => {
  const response = await api.get('/reports');
  return response.data;
};

export const searchReports = async (query: string): Promise<Report[]> => {
  const response = await api.get('/reports/search', { params: { query } });
  return response.data;
};

export const deleteReport = async (id: number): Promise<void> => {
  await api.delete(`/reports/${id}`);
}; 