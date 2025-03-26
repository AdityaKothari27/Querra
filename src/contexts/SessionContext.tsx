import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SearchResult, SearchConfig } from '../types';

interface SessionContextType {
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  setSearchResults: (results: SearchResult[]) => void;
  selectedSources: string[];
  setSelectedSources: (sources: string[]) => void;
  selectedDocumentIds: number[];
  setSelectedDocumentIds: (ids: number[]) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchConfig: SearchConfig | null;
  setSearchConfig: (config: SearchConfig | null) => void;
  
  // Report state
  generatedReport: string | null;
  setGeneratedReport: (report: string | null) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [searchConfig, setSearchConfig] = useState<SearchConfig | null>(null);
  
  // Report state
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  
  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('researchSession');
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        setSearchQuery(parsedSession.searchQuery || '');
        setSearchResults(parsedSession.searchResults || []);
        setSelectedSources(parsedSession.selectedSources || []);
        setSelectedDocumentIds(parsedSession.selectedDocumentIds || []);
        setSelectedCategory(parsedSession.selectedCategory || 'general');
        setSearchConfig(parsedSession.searchConfig || null);
        setGeneratedReport(parsedSession.generatedReport || null);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      // If loading fails, clear localStorage to prevent future errors
      localStorage.removeItem('researchSession');
    }
  }, []);
  
  // Save session to localStorage whenever state changes
  useEffect(() => {
    try {
      const sessionData = {
        searchQuery,
        searchResults,
        selectedSources,
        selectedDocumentIds,
        selectedCategory,
        searchConfig,
        generatedReport
      };
      localStorage.setItem('researchSession', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }, [searchQuery, searchResults, selectedSources, selectedDocumentIds, selectedCategory, searchConfig, generatedReport]);
  
  const clearSession = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedSources([]);
    setSelectedDocumentIds([]);
    setSelectedCategory('general');
    setSearchConfig(null);
    setGeneratedReport(null);
    localStorage.removeItem('researchSession');
  };
  
  return (
    <SessionContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        selectedSources,
        setSelectedSources,
        selectedDocumentIds,
        setSelectedDocumentIds,
        selectedCategory,
        setSelectedCategory,
        searchConfig,
        setSearchConfig,
        generatedReport,
        setGeneratedReport,
        clearSession
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}; 