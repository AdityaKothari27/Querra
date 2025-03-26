import axios from 'axios';
import { SearchResult, Report, Document, SearchConfig } from '../types/index';

const api = axios.create({
  baseURL: '/api'
});

// Mock data for development
const mockSearchResults: Record<string, SearchResult[]> = {
  // Keep your existing mock data
};

export const searchWeb = async (
  query: string,
  config: SearchConfig
): Promise<SearchResult[]> => {
  try {
    const response = await api.post('/search', {
      query,
      maxResults: config.maxResults,
      timeFilter: config.timeFilter,
      excludedDomains: config.excludedDomains,
      category: config.category,
      page: config.page
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
  documentIds: number[],
  promptTemplate: string
) => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, sources, documentIds, promptTemplate }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate report');
  }

  return response.json();
};

export const getReports = async (): Promise<Report[]> => {
  try {
    const response = await api.get('/reports');
    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
};

export const getDocuments = async (): Promise<Document[]> => {
  try {
    const response = await api.get('/documents');
    return response.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};

export const searchReports = async (query: string): Promise<Report[]> => {
  try {
    const response = await api.get('/reports/search', { params: { query } });
    return response.data;
  } catch (error) {
    console.error('Error searching reports:', error);
    return [];
  }
};

export const deleteReport = async (reportId: number) => {
  try {
    const response = await api.delete(`/reports/${reportId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

export const deleteDocument = async (id: number): Promise<void> => {
  try {
    await api.delete(`/documents`, { params: { id } });
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}; 