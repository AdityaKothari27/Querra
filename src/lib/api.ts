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
  } catch (error: any) {
    console.error('Search API error:', error);
    if (error.response?.status === 429) {
      const retryAfter = error.response.data?.retryAfter || 60;
      throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
    }
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
  promptTemplate: string,
  generationMode: 'traditional' | 'fast' | 'chat' = 'traditional',
  model: string = 'gemini-2.5-flash'
) => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, sources, documentIds, promptTemplate, generationMode, model }),
  });

  if (response.status === 429) {
    const data = await response.json();
    throw new Error(data.message || 'Rate limit exceeded. Please wait before trying again.');
  }

  if (!response.ok) {
    throw new Error('Failed to generate report');
  }

  return response.json();
};

export const sendChatMessage = async (
  message: string,
  sources: string[],
  documentIds: number[] = [],
  conversationHistory: Array<{role: string, content: string}> = [],
  model: string = 'gemini-2.5-flash'
) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sources, documentIds, conversationHistory, model }),
  });

  if (!response.ok) {
    throw new Error('Failed to send chat message');
  }

  return response.json();
};

export const sendChatMessageStream = async (
  message: string,
  sources: string[],
  documentIds: number[] = [],
  conversationHistory: Array<{role: string, content: string}> = [],
  model: string = 'gemini-2.5-flash',
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sources, documentIds, conversationHistory, model }),
    });

    if (response.status === 429) {
      const data = await response.json();
      onError(data.message || 'Rate limit exceeded. Please wait before trying again.');
      return;
    }

    if (!response.ok) {
      throw new Error(`Failed to send chat message: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body available for reading');
    }

    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete();
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        onChunk(chunk);
      }
    }
  } catch (error) {
    console.error('Streaming error:', error);
    onError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
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