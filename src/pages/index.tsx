import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import SearchSection from '../components/SearchSection';
import ReportSection from '../components/ReportSection';
import CategorySelector from '../components/CategorySelector';
import { SearchConfig } from '../types';
import { searchWeb } from '../lib/api';
import { getCategoryById } from '../config/categories';
import { useSession } from '../contexts/SessionContext';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const {
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
    setSearchConfig,
    generatedReport,
    generationMode
  } = useSession();
  
  // Log session data on mount for debugging
  useEffect(() => {
    console.log('Session data on mount:', {
      searchQuery,
      searchResultsCount: searchResults.length,
      selectedSourcesCount: selectedSources.length,
      selectedDocumentIdsCount: selectedDocumentIds.length,
      selectedCategory,
      generatedReport: generatedReport ? 'Present' : 'None',
      generationMode
    });
  }, [searchQuery, searchResults, selectedSources, selectedDocumentIds, selectedCategory, generatedReport, generationMode]);

  const handleSearch = async (query: string, config: SearchConfig) => {
    setIsLoading(true);
    setSearchQuery(query);
    setSearchConfig(config);
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
    setSelectedDocumentIds([]);
  };

  const categoryConfig = getCategoryById(selectedCategory);

  return (
    <Layout>
      <Head>
        <title>Querra - AI-Powered Research Assistant</title>
        <meta name="description" content="Querra - AI-powered research assistant for comprehensive reports" />
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
          selectedSources={selectedSources}
          selectedDocumentIds={selectedDocumentIds}
        />
        
        <ReportSection 
          searchQuery={searchQuery}
          selectedSources={selectedSources}
          selectedDocumentIds={selectedDocumentIds}
          categoryConfig={categoryConfig}
          initialReport={generatedReport}
        />
      </div>
    </Layout>
  );
} 