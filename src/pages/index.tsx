import { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import SearchSection from '../components/SearchSection';
import ReportSection from '../components/ReportSection';
import CategorySelector from '../components/CategorySelector';
import { SearchResult, SearchConfig } from '../types';
import { searchWeb } from '../lib/api';
import { getCategoryById } from '../config/categories';

export default function Home() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  
  const handleSearch = async (query: string, config: SearchConfig) => {
    setIsLoading(true);
    setSearchQuery(query);
    try {
      // Add the category to the search config
      const categoryConfig = {
        ...config,
        category: selectedCategory
      };
      const results = await searchWeb(query, categoryConfig);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
      alert('Failed to search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceSelect = (sources: string[], documentIds: number[]) => {
    setSelectedSources(sources);
    setSelectedDocumentIds(documentIds);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Reset search results when changing categories
    setSearchResults([]);
    setSelectedSources([]);
  };

  const categoryConfig = getCategoryById(selectedCategory);

  return (
    <Layout>
      <Head>
        <title>Deep Research - AI-Powered Research Assistant</title>
        <meta name="description" content="AI-powered research assistant for comprehensive reports" />
      </Head>

      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Research Assistant</h1>
        
        <CategorySelector 
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />
        
        <SearchSection 
          onSearch={handleSearch}
          onSourceSelect={handleSourceSelect}
          isLoading={isLoading}
          searchResults={searchResults}
          categoryConfig={categoryConfig}
        />
        
        <ReportSection 
          searchQuery={searchQuery}
          selectedSources={selectedSources}
          selectedDocumentIds={selectedDocumentIds}
          categoryConfig={categoryConfig}
        />
      </div>
    </Layout>
  );
} 