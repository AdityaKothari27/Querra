import { createContext, useContext, useState, useEffect } from 'react';

interface SessionContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: any[];
  setSearchResults: (results: any[]) => void;
  selectedSources: string[];
  setSelectedSources: (sources: string[]) => void;
  selectedDocumentIds: number[];
  setSelectedDocumentIds: (ids: number[]) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchConfig: any;
  setSearchConfig: (config: any) => void;
  generatedReport: any;
  setGeneratedReport: (report: any) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [searchConfig, setSearchConfig] = useState<any>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const clearSession = () => {
    // Set all state to initial values
    setSearchQuery('');
    setSearchResults([]);
    setSelectedSources([]);
    setSelectedDocumentIds([]);
    setSelectedCategory('general');
    setSearchConfig(null);
    setGeneratedReport(null);
    
    // Remove from localStorage
    localStorage.removeItem('researchSession');
    
    // Log for verification
    console.log('Session cleared - state reset to:', {
      searchQuery: '',
      searchResults: [],
      selectedSources: [],
      selectedDocumentIds: [],
      selectedCategory: 'general',
      searchConfig: null,
      generatedReport: null
    });
  };

  useEffect(() => {
    const sessionData = localStorage.getItem('researchSession');
    if (sessionData) {
      const {
        searchQuery,
        searchResults,
        selectedSources,
        selectedDocumentIds,
        selectedCategory,
        searchConfig,
        generatedReport,
      } = JSON.parse(sessionData);
      setSearchQuery(searchQuery);
      setSearchResults(searchResults);
      setSelectedSources(selectedSources);
      setSelectedDocumentIds(selectedDocumentIds);
      setSelectedCategory(selectedCategory);
      setSearchConfig(searchConfig);
      setGeneratedReport(generatedReport);
    }
  }, []);

  useEffect(() => {
    const sessionData = {
      searchQuery,
      searchResults,
      selectedSources,
      selectedDocumentIds,
      selectedCategory,
      searchConfig,
      generatedReport,
    };
    localStorage.setItem('researchSession', JSON.stringify(sessionData));
  }, [
    searchQuery,
    searchResults,
    selectedSources,
    selectedDocumentIds,
    selectedCategory,
    searchConfig,
    generatedReport,
  ]);

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
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
