import axios from 'axios';
import { SearchResult, Report, SearchConfig } from '../types/index';

const api = axios.create({
  baseURL: '/api'
});

// Mock data for development
const mockSearchResults: Record<string, SearchResult[]> = {
  general: [
    {
      title: 'General search result 1',
      url: 'https://example.com/general1',
      snippet: 'This is a general search result...'
    },
    // Add more general results
  ],
  academic: [
    {
      title: 'Academic paper on research topic',
      url: 'https://example.com/academic1',
      snippet: 'This academic paper explores...'
    },
    // Add more academic results
  ],
  financial: [
    {
      title: 'Financial analysis of market trends',
      url: 'https://example.com/financial1',
      snippet: 'This financial report shows...'
    },
    // Add more financial results
  ],
  // Add data for other categories (tech, health, legal)
};

export const searchWeb = async (
  query: string,
  config: SearchConfig
): Promise<SearchResult[]> => {
  // In a real app, this would call a search API
  console.log('Searching for:', query, 'with config:', config);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock results based on category
  const category = config.category || 'general';
  const results = mockSearchResults[category] || mockSearchResults.general;
  
  return results.slice(0, config.maxResults);
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

export const deleteReport = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/reports/${id}`);
  return response.data.success;
}; 