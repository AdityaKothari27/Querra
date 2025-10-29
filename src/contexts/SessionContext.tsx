import { createContext, useContext, useState, useEffect } from 'react';
import { ChatMessage } from '../types/index';

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
  generationMode: 'traditional' | 'fast' | 'chat';
  setGenerationMode: (mode: 'traditional' | 'fast' | 'chat') => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  useOwnKeys: boolean;
  setUseOwnKeys: (use: boolean) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  groqApiKey: string;
  setGroqApiKey: (key: string) => void;
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
  const [generationMode, setGenerationMode] = useState<'traditional' | 'fast' | 'chat'>('traditional');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // BYOK (Bring Your Own Keys) state
  const [useOwnKeys, setUseOwnKeys] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');

  const clearSession = () => {
    // Set all state to initial values
    setSearchQuery('');
    setSearchResults([]);
    setSelectedSources([]);
    setSelectedDocumentIds([]);
    setSelectedCategory('general');
    setSearchConfig(null);
    setGeneratedReport(null);
    setGenerationMode('traditional');
    setSelectedModel('gemini-2.5-flash');
    setChatMessages([]);
    // Note: We don't clear API keys on session clear - they persist
    
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
      generatedReport: null,
      generationMode: 'traditional',
      chatMessages: []
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
        generationMode,
        selectedModel,
        chatMessages,
      } = JSON.parse(sessionData);
      setSearchQuery(searchQuery || '');
      setSearchResults(searchResults || []);
      setSelectedSources(selectedSources || []);
      setSelectedDocumentIds(selectedDocumentIds || []);
      setSelectedCategory(selectedCategory || 'general');
      setSearchConfig(searchConfig);
      setGeneratedReport(generatedReport);
      setGenerationMode(generationMode || 'traditional');
      setSelectedModel(selectedModel || 'gemini-2.5-flash');
      setChatMessages((chatMessages || []).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    }
    
    // Load API keys from separate localStorage (for security isolation)
    const apiKeysData = localStorage.getItem('querraApiKeys');
    if (apiKeysData) {
      try {
        const { useOwnKeys, geminiApiKey, groqApiKey } = JSON.parse(apiKeysData);
        setUseOwnKeys(useOwnKeys || false);
        setGeminiApiKey(geminiApiKey || '');
        setGroqApiKey(groqApiKey || '');
      } catch (error) {
        console.error('Error loading API keys:', error);
      }
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
      generationMode,
      selectedModel,
      chatMessages,
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
    generationMode,
    selectedModel,
    chatMessages,
  ]);

  // Persist API keys separately
  useEffect(() => {
    const apiKeysData = {
      useOwnKeys,
      geminiApiKey,
      groqApiKey,
    };
    localStorage.setItem('querraApiKeys', JSON.stringify(apiKeysData));
  }, [useOwnKeys, geminiApiKey, groqApiKey]);

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
        generationMode,
        setGenerationMode,
        selectedModel,
        setSelectedModel,
        chatMessages,
        setChatMessages,
        useOwnKeys,
        setUseOwnKeys,
        geminiApiKey,
        setGeminiApiKey,
        groqApiKey,
        setGroqApiKey,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
